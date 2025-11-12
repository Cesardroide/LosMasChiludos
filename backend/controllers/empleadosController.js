const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// Obtener todos los empleados
const obtenerEmpleados = async (req, res) => {
    try {
        const [empleados] = await pool.query(`
            SELECT 
                e.id,
                e.codigo_empleado,
                u.nombre_completo,
                u.username,
                u.email,
                e.puesto,
                e.salario,
                e.fecha_contratacion,
                e.activo,
                e.fecha_creacion,
                u.rol
            FROM empleados e
            INNER JOIN usuarios u ON e.usuario_id = u.id
            ORDER BY e.fecha_creacion DESC
        `);

        res.json({
            success: true,
            message: 'Empleados obtenidos exitosamente',
            data: empleados
        });

    } catch (error) {
        console.error('Error al obtener empleados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener empleados',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener un empleado por ID
const obtenerEmpleadoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const [empleados] = await pool.query(`
            SELECT 
                e.id,
                e.codigo_empleado,
                u.nombre_completo,
                u.username,
                u.email,
                e.puesto,
                e.salario,
                e.fecha_contratacion,
                e.activo,
                u.rol
            FROM empleados e
            INNER JOIN usuarios u ON e.usuario_id = u.id
            WHERE e.id = ?
        `, [id]);

        if (empleados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Empleado obtenido exitosamente',
            data: empleados[0]
        });

    } catch (error) {
        console.error('Error al obtener empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener empleado',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Crear nuevo empleado
const crearEmpleado = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const {
            nombre_completo,
            username,
            email,
            password,
            puesto,
            salario,
            fecha_contratacion
        } = req.body;

        // Validaciones
        if (!nombre_completo || !username || !email || !password || !puesto) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Todos los campos obligatorios deben ser proporcionados'
            });
        }

        // Verificar si el usuario o email ya existe
        const [usuariosExistentes] = await connection.query(
            'SELECT id FROM usuarios WHERE username = ? OR email = ?',
            [username, email]
        );

        if (usuariosExistentes.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'El usuario o email ya está registrado'
            });
        }

        // IMPORTANTE: Guardar la contraseña temporal ANTES de hashear
        const passwordTemporal = password;

        // Encriptar contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Determinar el rol basado en el puesto
        let rol = 'mesero';
        if (puesto === 'admin') {
            rol = 'admin';
        }

        // Insertar usuario
        const [resultUsuario] = await connection.query(
            'INSERT INTO usuarios (nombre_completo, username, email, password_hash, rol) VALUES (?, ?, ?, ?, ?)',
            [nombre_completo, username, email, passwordHash, rol]
        );

        const usuarioId = resultUsuario.insertId;

        // Generar código de empleado único
        const [maxCodigo] = await connection.query(
            'SELECT MAX(CAST(SUBSTRING(codigo_empleado, 5) AS UNSIGNED)) as max_num FROM empleados WHERE codigo_empleado LIKE "EMP-%"'
        );
        
        const siguienteNumero = (maxCodigo[0].max_num || 0) + 1;
        const codigoEmpleado = `EMP-${String(siguienteNumero).padStart(3, '0')}`;

        // Insertar empleado
        await connection.query(
            'INSERT INTO empleados (usuario_id, codigo_empleado, puesto, salario, fecha_contratacion) VALUES (?, ?, ?, ?, ?)',
            [usuarioId, codigoEmpleado, puesto, salario || null, fecha_contratacion || null]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Empleado creado exitosamente',
            data: {
                codigo_empleado: codigoEmpleado,
                nombre_completo,
                username,
                email,
                puesto,
                password_temporal: passwordTemporal  // Devolver la contraseña SIN hashear
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al crear empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear empleado',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

// Actualizar empleado
const actualizarEmpleado = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const {
            nombre_completo,
            username,
            email,
            password,
            puesto,
            salario,
            fecha_contratacion,
            activo
        } = req.body;

        // Verificar que el empleado existe
        const [empleadoExistente] = await connection.query(
            'SELECT usuario_id FROM empleados WHERE id = ?',
            [id]
        );

        if (empleadoExistente.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        const usuarioId = empleadoExistente[0].usuario_id;

        // Actualizar usuario
        let updateUsuarioQuery = 'UPDATE usuarios SET nombre_completo = ?, username = ?, email = ?';
        let updateUsuarioParams = [nombre_completo, username, email];

        // Si se proporciona nueva contraseña
        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);
            updateUsuarioQuery += ', password_hash = ?';
            updateUsuarioParams.push(passwordHash);
        }

        // Actualizar rol según puesto
        if (puesto) {
            const rol = puesto === 'admin' ? 'admin' : 'mesero';
            updateUsuarioQuery += ', rol = ?';
            updateUsuarioParams.push(rol);
        }

        updateUsuarioQuery += ' WHERE id = ?';
        updateUsuarioParams.push(usuarioId);

        await connection.query(updateUsuarioQuery, updateUsuarioParams);

        // Actualizar empleado
        const updateEmpleadoQuery = 'UPDATE empleados SET puesto = ?, salario = ?, fecha_contratacion = ?, activo = ? WHERE id = ?';
        await connection.query(updateEmpleadoQuery, [
            puesto,
            salario,
            fecha_contratacion,
            activo !== undefined ? activo : true,
            id
        ]);

        await connection.commit();

        res.json({
            success: true,
            message: 'Empleado actualizado exitosamente'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al actualizar empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar empleado',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

// Eliminar empleado
const eliminarEmpleado = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Verificar que el empleado existe y obtener el usuario_id
        const [empleado] = await connection.query(
            'SELECT usuario_id FROM empleados WHERE id = ?',
            [id]
        );

        if (empleado.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        const usuarioId = empleado[0].usuario_id;

        // Primero eliminar el empleado
        await connection.query('DELETE FROM empleados WHERE id = ?', [id]);
        
        // Luego eliminar el usuario
        await connection.query('DELETE FROM usuarios WHERE id = ?', [usuarioId]);

        await connection.commit();

        res.json({
            success: true,
            message: 'Empleado eliminado exitosamente'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al eliminar empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar empleado',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

// Cambiar estado de empleado (activar/desactivar)
const cambiarEstadoEmpleado = async (req, res) => {
    try {
        const { id } = req.params;
        const { activo } = req.body;

        const [result] = await pool.query(
            'UPDATE empleados SET activo = ? WHERE id = ?',
            [activo, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        res.json({
            success: true,
            message: `Empleado ${activo ? 'activado' : 'desactivado'} exitosamente`
        });

    } catch (error) {
        console.error('Error al cambiar estado del empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado del empleado',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    obtenerEmpleados,
    obtenerEmpleadoPorId,
    crearEmpleado,
    actualizarEmpleado,
    eliminarEmpleado,
    cambiarEstadoEmpleado
};