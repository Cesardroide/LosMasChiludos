const { pool } = require('../config/database');

// Crear una nueva reservación
const crearReservacion = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const {
            mesa_id,
            nombre_completo,
            telefono,
            email,
            numero_personas,
            fecha_reservacion,
            hora_reservacion,
            comentarios
        } = req.body;

        const usuario_id = req.usuario.id;

        // Validaciones
        if (!mesa_id || !nombre_completo || !telefono || !numero_personas || !fecha_reservacion || !hora_reservacion) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Todos los campos obligatorios deben ser proporcionados'
            });
        }

        // Verificar que la mesa existe y está disponible
        const [mesa] = await connection.query(
            'SELECT * FROM mesas WHERE id = ? AND activo = true',
            [mesa_id]
        );

        if (mesa.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Mesa no encontrada o inactiva'
            });
        }

        // Verificar si la mesa ya está reservada para esa fecha y hora
        const [reservacionesExistentes] = await connection.query(
            `SELECT * FROM reservaciones 
             WHERE mesa_id = ? 
             AND fecha_reservacion = ? 
             AND hora_reservacion = ?
             AND estado IN ('confirmada', 'en_curso')`,
            [mesa_id, fecha_reservacion, hora_reservacion]
        );

        if (reservacionesExistentes.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'La mesa ya está reservada para esa fecha y hora'
            });
        }

        // Verificar capacidad de la mesa
        if (numero_personas > mesa[0].capacidad) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `La mesa seleccionada tiene capacidad para ${mesa[0].capacidad} personas`
            });
        }

        // Crear la reservación
        const [result] = await connection.query(
            `INSERT INTO reservaciones 
             (usuario_id, mesa_id, nombre_completo, telefono, email, numero_personas, fecha_reservacion, hora_reservacion, comentarios, estado) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [usuario_id, mesa_id, nombre_completo, telefono, email || null, numero_personas, fecha_reservacion, hora_reservacion, comentarios || null, 'confirmada']
        );

        // Actualizar el estado de la mesa a 'reservada'
        await connection.query(
            'UPDATE mesas SET estado = ? WHERE id = ?',
            ['reservada', mesa_id]
        );

        console.log(`✅ Reservación creada y Mesa #${mesa_id} marcada como reservada`);

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Reservación creada exitosamente',
            data: {
                reservacion_id: result.insertId,
                mesa_numero: mesa[0].numero_mesa,
                fecha_reservacion,
                hora_reservacion,
                estado: 'confirmada'
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al crear reservación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear reservación',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

// Obtener todas las reservaciones
const obtenerReservaciones = async (req, res) => {
    try {
        const { estado, fecha, mesa_id } = req.query;
        
        let query = `
            SELECT 
                r.*,
                m.numero_mesa,
                m.capacidad as mesa_capacidad,
                m.ubicacion as mesa_ubicacion,
                u.nombre_completo as usuario_nombre
            FROM reservaciones r
            INNER JOIN mesas m ON r.mesa_id = m.id
            INNER JOIN usuarios u ON r.usuario_id = u.id
            WHERE 1=1
        `;
        
        const params = [];

        if (estado) {
            query += ' AND r.estado = ?';
            params.push(estado);
        }

        if (fecha) {
            query += ' AND r.fecha_reservacion = ?';
            params.push(fecha);
        } else {
            // Por defecto, mostrar reservaciones de hoy y futuras
            query += ' AND r.fecha_reservacion >= CURDATE()';
        }

        if (mesa_id) {
            query += ' AND r.mesa_id = ?';
            params.push(mesa_id);
        }

        query += ' ORDER BY r.fecha_reservacion ASC, r.hora_reservacion ASC';

        console.log('🔍 Query de reservaciones:', query);
        console.log('📊 Parámetros:', params);

        const [reservaciones] = await pool.query(query, params);

        console.log(`✅ Reservaciones encontradas: ${reservaciones.length}`);

        res.json({
            success: true,
            data: reservaciones
        });

    } catch (error) {
        console.error('Error al obtener reservaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reservaciones',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener una reservación por ID
const obtenerReservacionPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const [reservaciones] = await pool.query(`
            SELECT 
                r.*,
                m.numero_mesa,
                m.capacidad as mesa_capacidad,
                m.ubicacion as mesa_ubicacion,
                u.nombre_completo as usuario_nombre,
                u.email as usuario_email
            FROM reservaciones r
            INNER JOIN mesas m ON r.mesa_id = m.id
            INNER JOIN usuarios u ON r.usuario_id = u.id
            WHERE r.id = ?
        `, [id]);

        if (reservaciones.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reservación no encontrada'
            });
        }

        res.json({
            success: true,
            data: reservaciones[0]
        });

    } catch (error) {
        console.error('Error al obtener reservación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reservación',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar estado de reservación
const actualizarEstadoReservacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const estadosValidos = ['confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio'];
        
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        const [result] = await pool.query(
            'UPDATE reservaciones SET estado = ? WHERE id = ?',
            [estado, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reservación no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Estado de la reservación actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado de la reservación',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener reservaciones del usuario actual
const obtenerMisReservaciones = async (req, res) => {
    try {
        const usuario_id = req.usuario.id;

        const [reservaciones] = await pool.query(`
            SELECT 
                r.*,
                m.numero_mesa,
                m.capacidad as mesa_capacidad,
                m.ubicacion as mesa_ubicacion
            FROM reservaciones r
            INNER JOIN mesas m ON r.mesa_id = m.id
            WHERE r.usuario_id = ?
            ORDER BY r.fecha_reservacion DESC, r.hora_reservacion DESC
        `, [usuario_id]);

        res.json({
            success: true,
            data: reservaciones
        });

    } catch (error) {
        console.error('Error al obtener mis reservaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reservaciones',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Cancelar reservación
const cancelarReservacion = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_id = req.usuario.id;

        // Verificar que la reservación existe y pertenece al usuario
        const [reservaciones] = await pool.query(
            'SELECT * FROM reservaciones WHERE id = ? AND usuario_id = ?',
            [id, usuario_id]
        );

        if (reservaciones.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reservación no encontrada o no tienes permiso para cancelarla'
            });
        }

        if (reservaciones[0].estado === 'cancelada') {
            return res.status(400).json({
                success: false,
                message: 'La reservación ya está cancelada'
            });
        }

        // Actualizar estado a cancelada
        await pool.query(
            'UPDATE reservaciones SET estado = ? WHERE id = ?',
            ['cancelada', id]
        );

        // Liberar la mesa (cambiar estado a disponible)
        await pool.query(
            'UPDATE mesas SET estado = ? WHERE id = ?',
            ['disponible', reservaciones[0].mesa_id]
        );

        console.log(`✅ Reservación #${id} cancelada y Mesa #${reservaciones[0].mesa_id} liberada`);

        res.json({
            success: true,
            message: 'Reservación cancelada exitosamente'
        });

    } catch (error) {
        console.error('Error al cancelar reservación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cancelar reservación',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Completar una reservación (liberar mesa) - Para meseros
const completarReservacion = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener información de la reservación
        const [reservacion] = await pool.query(
            'SELECT * FROM reservaciones WHERE id = ?',
            [id]
        );

        if (reservacion.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reservación no encontrada'
            });
        }

        const reservacionData = reservacion[0];

        // Actualizar estado de la reservación a completada
        await pool.query(
            'UPDATE reservaciones SET estado = ? WHERE id = ?',
            ['completada', id]
        );

        // Liberar la mesa (cambiar estado a disponible)
        await pool.query(
            'UPDATE mesas SET estado = ? WHERE id = ?',
            ['disponible', reservacionData.mesa_id]
        );

        console.log(`✅ Reservación #${id} completada y Mesa #${reservacionData.mesa_id} liberada`);

        res.json({
            success: true,
            message: 'Reservación completada y mesa liberada exitosamente'
        });

    } catch (error) {
        console.error('Error al completar reservación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al completar reservación',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    crearReservacion,
    obtenerReservaciones,
    obtenerReservacionPorId,
    actualizarEstadoReservacion,
    obtenerMisReservaciones,
    cancelarReservacion,
    completarReservacion
};