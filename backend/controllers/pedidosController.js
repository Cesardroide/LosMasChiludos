const { pool } = require('../config/database');

// Crear un nuevo pedido
const crearPedido = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const {
            mesa_id,
            productos, // Array de { producto_id, cantidad, precio_unitario, preferencias }
            tipo,
            comentarios
        } = req.body;

        const usuario_id = req.usuario.id; // Del middleware de autenticación

        // Validaciones
        if (!productos || productos.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'El pedido debe contener al menos un producto'
            });
        }

        // Calcular el total
        let total = 0;
        for (const item of productos) {
            total += item.precio_unitario * item.cantidad;
        }

        // Crear el pedido
        const [resultPedido] = await connection.query(
            'INSERT INTO pedidos (usuario_id, mesa_id, total, tipo, comentarios, estado) VALUES (?, ?, ?, ?, ?, ?)',
            [usuario_id, mesa_id || null, total, tipo || 'local', comentarios || null, 'pendiente']
        );

        const pedido_id = resultPedido.insertId;

        // Insertar los detalles del pedido
        for (const item of productos) {
            const subtotal = item.precio_unitario * item.cantidad;
            await connection.query(
                'INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal, preferencias) VALUES (?, ?, ?, ?, ?, ?)',
                [pedido_id, item.producto_id, item.cantidad, item.precio_unitario, subtotal, item.preferencias || null]
            );
        }

        // Si tiene mesa, actualizar el estado de la mesa
        if (mesa_id) {
            await connection.query(
                'UPDATE mesas SET estado = ? WHERE id = ?',
                ['ocupada', mesa_id]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente',
            data: {
                pedido_id,
                total,
                estado: 'pendiente'
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al crear pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear pedido',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

// Obtener todos los pedidos (para meseros/admin)
const obtenerPedidos = async (req, res) => {
    try {
        const { estado, fecha, mesa_id } = req.query;
        
        let query = `
            SELECT 
                p.id,
                p.usuario_id,
                p.mesa_id,
                m.numero_mesa,
                p.total,
                p.estado,
                p.tipo,
                p.comentarios,
                p.fecha_pedido,
                u.nombre_completo as cliente_nombre
            FROM pedidos p
            LEFT JOIN mesas m ON p.mesa_id = m.id
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            WHERE 1=1
        `;
        
        const params = [];

        if (estado) {
            query += ' AND p.estado = ?';
            params.push(estado);
        }

        if (fecha) {
            // Buscar pedidos de todo el día en la zona horaria local
            query += ' AND DATE(p.fecha_pedido) = ?';
            params.push(fecha);
        }

        if (mesa_id) {
            query += ' AND p.mesa_id = ?';
            params.push(mesa_id);
        }

        query += ' ORDER BY p.fecha_pedido DESC';

        console.log('🔍 Query de pedidos:', query);
        console.log('📊 Parámetros:', params);

        const [pedidos] = await pool.query(query, params);

        console.log(`✅ Pedidos encontrados: ${pedidos.length}`);

        // Obtener detalles de cada pedido
        for (let pedido of pedidos) {
            const [detalles] = await pool.query(`
                SELECT 
                    dp.*,
                    prod.nombre as producto_nombre,
                    prod.descripcion as producto_descripcion
                FROM detalle_pedidos dp
                INNER JOIN productos prod ON dp.producto_id = prod.id
                WHERE dp.pedido_id = ?
            `, [pedido.id]);
            
            pedido.items = detalles;
        }

        res.json({
            success: true,
            data: pedidos
        });

    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedidos',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener un pedido por ID
const obtenerPedidoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const [pedidos] = await pool.query(`
            SELECT 
                p.*,
                m.numero_mesa,
                u.nombre_completo as cliente_nombre,
                u.email as cliente_email
            FROM pedidos p
            LEFT JOIN mesas m ON p.mesa_id = m.id
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.id = ?
        `, [id]);

        if (pedidos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        const pedido = pedidos[0];

        // Obtener detalles del pedido
        const [detalles] = await pool.query(`
            SELECT 
                dp.*,
                prod.nombre as producto_nombre,
                prod.descripcion as producto_descripcion
            FROM detalle_pedidos dp
            INNER JOIN productos prod ON dp.producto_id = prod.id
            WHERE dp.pedido_id = ?
        `, [id]);

        pedido.items = detalles;

        res.json({
            success: true,
            data: pedido
        });

    } catch (error) {
        console.error('Error al obtener pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedido',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar estado del pedido
const actualizarEstadoPedido = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const estadosValidos = ['pendiente', 'en_preparacion', 'listo', 'entregado', 'pagado', 'cancelado'];
        
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        const [result] = await pool.query(
            'UPDATE pedidos SET estado = ? WHERE id = ?',
            [estado, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Estado del pedido actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado del pedido',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener pedidos del usuario actual
const obtenerMisPedidos = async (req, res) => {
    try {
        const usuario_id = req.usuario.id;

        const [pedidos] = await pool.query(`
            SELECT 
                p.*,
                m.numero_mesa
            FROM pedidos p
            LEFT JOIN mesas m ON p.mesa_id = m.id
            WHERE p.usuario_id = ?
            ORDER BY p.fecha_pedido DESC
        `, [usuario_id]);

        // Obtener detalles de cada pedido
        for (let pedido of pedidos) {
            const [detalles] = await pool.query(`
                SELECT 
                    dp.*,
                    prod.nombre as producto_nombre
                FROM detalle_pedidos dp
                INNER JOIN productos prod ON dp.producto_id = prod.id
                WHERE dp.pedido_id = ?
            `, [pedido.id]);
            
            pedido.items = detalles;
        }

        res.json({
            success: true,
            data: pedidos
        });

    } catch (error) {
        console.error('Error al obtener mis pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedidos',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    crearPedido,
    obtenerPedidos,
    obtenerPedidoPorId,
    actualizarEstadoPedido,
    obtenerMisPedidos
};