const { pool } = require('../config/database');

// Obtener todos los productos
const obtenerProductos = async (req, res) => {
    try {
        const { categoria, disponible } = req.query;

        let query = 'SELECT * FROM productos WHERE 1=1';
        const params = [];

        if (categoria) {
            query += ' AND categoria = ?';
            params.push(categoria);
        }

        if (disponible !== undefined) {
            query += ' AND disponible = ?';
            params.push(disponible === 'true' ? 1 : 0);
        }

        query += ' ORDER BY categoria, nombre';

        const [productos] = await pool.query(query, params);

        res.json({
            success: true,
            message: 'Productos obtenidos exitosamente',
            data: productos
        });

    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener un producto por ID
const obtenerProductoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const [productos] = await pool.query(
            'SELECT * FROM productos WHERE id = ?',
            [id]
        );

        if (productos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Producto obtenido exitosamente',
            data: productos[0]
        });

    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Crear nuevo producto
const crearProducto = async (req, res) => {
    try {
        const {
            nombre,
            descripcion,
            categoria,
            precio,
            nivel_picante,
            disponible,
            imagen_url
        } = req.body;

        // Validaciones
        if (!nombre || !categoria || !precio) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, categoría y precio son obligatorios'
            });
        }

        // Validar que el precio sea válido
        if (precio <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio debe ser mayor a 0'
            });
        }

        // Validar categoría
        const categoriasValidas = ['entrada', 'plato_fuerte', 'postre', 'bebida', 'otros'];
        if (!categoriasValidas.includes(categoria)) {
            return res.status(400).json({
                success: false,
                message: 'Categoría inválida'
            });
        }

        // Validar nivel de picante
        const nivelesValidos = ['sin_picante', 'poco', 'medio', 'muy_picante', 'extremo'];
        if (nivel_picante && !nivelesValidos.includes(nivel_picante)) {
            return res.status(400).json({
                success: false,
                message: 'Nivel de picante inválido'
            });
        }

        const [result] = await pool.query(
            `INSERT INTO productos 
            (nombre, descripcion, categoria, precio, nivel_picante, disponible, imagen_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre,
                descripcion || null,
                categoria,
                precio,
                nivel_picante || 'sin_picante',
                disponible !== undefined ? disponible : true,
                imagen_url || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: {
                id: result.insertId,
                nombre,
                categoria,
                precio
            }
        });

    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear producto',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar producto
const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            descripcion,
            categoria,
            precio,
            nivel_picante,
            disponible,
            imagen_url
        } = req.body;

        // Verificar que el producto existe
        const [productoExistente] = await pool.query(
            'SELECT id FROM productos WHERE id = ?',
            [id]
        );

        if (productoExistente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // Validaciones
        if (precio !== undefined && precio <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio debe ser mayor a 0'
            });
        }

        if (categoria) {
            const categoriasValidas = ['entrada', 'plato_fuerte', 'postre', 'bebida', 'otros'];
            if (!categoriasValidas.includes(categoria)) {
                return res.status(400).json({
                    success: false,
                    message: 'Categoría inválida'
                });
            }
        }

        if (nivel_picante) {
            const nivelesValidos = ['sin_picante', 'poco', 'medio', 'muy_picante', 'extremo'];
            if (!nivelesValidos.includes(nivel_picante)) {
                return res.status(400).json({
                    success: false,
                    message: 'Nivel de picante inválido'
                });
            }
        }

        const [result] = await pool.query(
            `UPDATE productos 
            SET nombre = ?, descripcion = ?, categoria = ?, precio = ?, 
                nivel_picante = ?, disponible = ?, imagen_url = ?
            WHERE id = ?`,
            [
                nombre,
                descripcion,
                categoria,
                precio,
                nivel_picante,
                disponible,
                imagen_url,
                id
            ]
        );

        res.json({
            success: true,
            message: 'Producto actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar producto',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Eliminar producto (con CASCADE - elimina detalles de pedidos asociados)
const eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el producto existe
        const [productos] = await pool.query(
            'SELECT * FROM productos WHERE id = ?',
            [id]
        );

        if (productos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        const producto = productos[0];

        // Contar cuántos pedidos usan este producto (para información)
        const [detalles] = await pool.query(
            'SELECT COUNT(*) as total FROM detalle_pedidos WHERE producto_id = ?',
            [id]
        );

        const totalDetalles = detalles[0].total;

        // Eliminar producto (CASCADE eliminará automáticamente los detalles)
        await pool.query('DELETE FROM productos WHERE id = ?', [id]);

        let mensaje = `Producto "${producto.nombre}" eliminado exitosamente`;
        
        if (totalDetalles > 0) {
            mensaje += ` (Se eliminaron también ${totalDetalles} registro(s) de pedidos asociado(s))`;
        }

        console.log(`✅ ${mensaje}`);

        res.json({
            success: true,
            message: mensaje,
            detalles: {
                producto_eliminado: producto.nombre,
                registros_eliminados: totalDetalles
            }
        });

    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar producto',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Cambiar disponibilidad de producto
const cambiarDisponibilidadProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { disponible } = req.body;

        const [result] = await pool.query(
            'UPDATE productos SET disponible = ? WHERE id = ?',
            [disponible, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        res.json({
            success: true,
            message: `Producto ${disponible ? 'activado' : 'desactivado'} exitosamente`
        });

    } catch (error) {
        console.error('Error al cambiar disponibilidad del producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar disponibilidad del producto',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener productos por categoría
const obtenerProductosPorCategoria = async (req, res) => {
    try {
        const { categoria } = req.params;

        const [productos] = await pool.query(
            'SELECT * FROM productos WHERE categoria = ? AND disponible = true ORDER BY nombre',
            [categoria]
        );

        res.json({
            success: true,
            message: 'Productos obtenidos exitosamente',
            data: productos
        });

    } catch (error) {
        console.error('Error al obtener productos por categoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos por categoría',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    obtenerProductos,
    obtenerProductoPorId,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    cambiarDisponibilidadProducto,
    obtenerProductosPorCategoria
};