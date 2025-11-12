const { pool } = require('../config/database');

// Obtener todas las mesas
const obtenerMesas = async (req, res) => {
    try {
        const { estado, ubicacion, activo } = req.query;

        let query = 'SELECT * FROM mesas WHERE 1=1';
        const params = [];

        if (estado) {
            query += ' AND estado = ?';
            params.push(estado);
        }

        if (ubicacion) {
            query += ' AND ubicacion = ?';
            params.push(ubicacion);
        }

        if (activo !== undefined) {
            query += ' AND activo = ?';
            params.push(activo === 'true' ? 1 : 0);
        }

        query += ' ORDER BY numero_mesa';

        const [mesas] = await pool.query(query, params);

        res.json({
            success: true,
            message: 'Mesas obtenidas exitosamente',
            data: mesas
        });

    } catch (error) {
        console.error('Error al obtener mesas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener mesas',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener una mesa por ID
const obtenerMesaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const [mesas] = await pool.query(
            'SELECT * FROM mesas WHERE id = ?',
            [id]
        );

        if (mesas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mesa no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Mesa obtenida exitosamente',
            data: mesas[0]
        });

    } catch (error) {
        console.error('Error al obtener mesa:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener mesa',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener una mesa por número
const obtenerMesaPorNumero = async (req, res) => {
    try {
        const { numero } = req.params;

        const [mesas] = await pool.query(
            'SELECT * FROM mesas WHERE numero_mesa = ?',
            [numero]
        );

        if (mesas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mesa no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Mesa obtenida exitosamente',
            data: mesas[0]
        });

    } catch (error) {
        console.error('Error al obtener mesa:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener mesa',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Crear nueva mesa
const crearMesa = async (req, res) => {
    try {
        const {
            numero_mesa,
            capacidad,
            ubicacion,
            estado
        } = req.body;

        // Validaciones
        if (!numero_mesa || !capacidad || !ubicacion) {
            return res.status(400).json({
                success: false,
                message: 'Número de mesa, capacidad y ubicación son obligatorios'
            });
        }

        // Validar que la capacidad sea válida
        if (capacidad <= 0) {
            return res.status(400).json({
                success: false,
                message: 'La capacidad debe ser mayor a 0'
            });
        }

        // Verificar si el número de mesa ya existe
        const [mesaExistente] = await pool.query(
            'SELECT id FROM mesas WHERE numero_mesa = ?',
            [numero_mesa]
        );

        if (mesaExistente.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El número de mesa ya existe'
            });
        }

        // Validar ubicación
        const ubicacionesValidas = ['interior', 'terraza', 'vip', 'barra'];
        if (!ubicacionesValidas.includes(ubicacion)) {
            return res.status(400).json({
                success: false,
                message: 'Ubicación inválida'
            });
        }

        // Validar estado si se proporciona
        if (estado) {
            const estadosValidos = ['disponible', 'ocupada', 'reservada', 'mantenimiento'];
            if (!estadosValidos.includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado inválido'
                });
            }
        }

        const [result] = await pool.query(
            `INSERT INTO mesas 
            (numero_mesa, capacidad, ubicacion, estado) 
            VALUES (?, ?, ?, ?)`,
            [
                numero_mesa,
                capacidad,
                ubicacion,
                estado || 'disponible'
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Mesa creada exitosamente',
            data: {
                id: result.insertId,
                numero_mesa,
                capacidad,
                ubicacion,
                estado: estado || 'disponible'
            }
        });

    } catch (error) {
        console.error('Error al crear mesa:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear mesa',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar mesa
const actualizarMesa = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            numero_mesa,
            capacidad,
            ubicacion,
            estado,
            activo
        } = req.body;

        // Verificar que la mesa existe
        const [mesaExistente] = await pool.query(
            'SELECT id FROM mesas WHERE id = ?',
            [id]
        );

        if (mesaExistente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mesa no encontrada'
            });
        }

        // Si se está cambiando el número de mesa, verificar que no exista
        if (numero_mesa) {
            const [mesaConMismoNumero] = await pool.query(
                'SELECT id FROM mesas WHERE numero_mesa = ? AND id != ?',
                [numero_mesa, id]
            );

            if (mesaConMismoNumero.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El número de mesa ya existe'
                });
            }
        }

        // Validaciones
        if (capacidad !== undefined && capacidad <= 0) {
            return res.status(400).json({
                success: false,
                message: 'La capacidad debe ser mayor a 0'
            });
        }

        if (ubicacion) {
            const ubicacionesValidas = ['interior', 'terraza', 'vip', 'barra'];
            if (!ubicacionesValidas.includes(ubicacion)) {
                return res.status(400).json({
                    success: false,
                    message: 'Ubicación inválida'
                });
            }
        }

        if (estado) {
            const estadosValidos = ['disponible', 'ocupada', 'reservada', 'mantenimiento'];
            if (!estadosValidos.includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado inválido'
                });
            }
        }

        const [result] = await pool.query(
            `UPDATE mesas 
            SET numero_mesa = ?, capacidad = ?, ubicacion = ?, estado = ?, activo = ?
            WHERE id = ?`,
            [
                numero_mesa,
                capacidad,
                ubicacion,
                estado,
                activo !== undefined ? activo : true,
                id
            ]
        );

        res.json({
            success: true,
            message: 'Mesa actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar mesa:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar mesa',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Eliminar mesa (con CASCADE - elimina reservaciones y pedidos asociados)
const eliminarMesa = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si la mesa existe
        const [mesas] = await pool.query(
            'SELECT * FROM mesas WHERE id = ?',
            [id]
        );

        if (mesas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mesa no encontrada'
            });
        }

        const mesa = mesas[0];

        // Contar registros asociados antes de eliminar (para información)
        const [reservaciones] = await pool.query(
            'SELECT COUNT(*) as total FROM reservaciones WHERE mesa_id = ?',
            [id]
        );

        const [pedidos] = await pool.query(
            'SELECT COUNT(*) as total FROM pedidos WHERE mesa_id = ?',
            [id]
        );

        const totalReservaciones = reservaciones[0].total;
        const totalPedidos = pedidos[0].total;

        // Eliminar mesa (CASCADE eliminará automáticamente reservaciones y pedidos)
        await pool.query('DELETE FROM mesas WHERE id = ?', [id]);

        let mensaje = `Mesa ${mesa.numero_mesa} eliminada exitosamente`;
        
        if (totalReservaciones > 0 || totalPedidos > 0) {
            mensaje += ` (Se eliminaron también ${totalReservaciones} reservación(es) y ${totalPedidos} pedido(s) asociado(s))`;
        }

        console.log(`✅ ${mensaje}`);

        res.json({
            success: true,
            message: mensaje,
            detalles: {
                mesa_eliminada: mesa.numero_mesa,
                reservaciones_eliminadas: totalReservaciones,
                pedidos_eliminados: totalPedidos
            }
        });

    } catch (error) {
        console.error('Error al eliminar mesa:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error al eliminar mesa',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Cambiar estado de mesa
const cambiarEstadoMesa = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        // Validar estado
        const estadosValidos = ['disponible', 'ocupada', 'reservada', 'mantenimiento'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        const [result] = await pool.query(
            'UPDATE mesas SET estado = ? WHERE id = ?',
            [estado, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mesa no encontrada'
            });
        }

        res.json({
            success: true,
            message: `Mesa marcada como ${estado} exitosamente`
        });

    } catch (error) {
        console.error('Error al cambiar estado de la mesa:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado de la mesa',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener mesas disponibles
const obtenerMesasDisponibles = async (req, res) => {
    try {
        const { capacidad_minima } = req.query;

        let query = "SELECT * FROM mesas WHERE estado = 'disponible' AND activo = true";
        const params = [];

        if (capacidad_minima) {
            query += ' AND capacidad >= ?';
            params.push(capacidad_minima);
        }

        query += ' ORDER BY numero_mesa';

        const [mesas] = await pool.query(query, params);

        res.json({
            success: true,
            message: 'Mesas disponibles obtenidas exitosamente',
            data: mesas
        });

    } catch (error) {
        console.error('Error al obtener mesas disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener mesas disponibles',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    obtenerMesas,
    obtenerMesaPorId,
    obtenerMesaPorNumero,
    crearMesa,
    actualizarMesa,
    eliminarMesa,
    cambiarEstadoMesa,
    obtenerMesasDisponibles
};