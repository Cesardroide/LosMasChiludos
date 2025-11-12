const express = require('express');
const router = express.Router();
const {
    obtenerProductos,
    obtenerProductoPorId,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    cambiarDisponibilidadProducto,
    obtenerProductosPorCategoria
} = require('../controllers/productosController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

// Rutas públicas (sin autenticación)
router.get('/', obtenerProductos);
router.get('/categoria/:categoria', obtenerProductosPorCategoria);
router.get('/:id', obtenerProductoPorId);

// Rutas protegidas (requieren autenticación y rol de admin)
router.post('/', verificarToken, verificarRol('admin'), crearProducto);
router.put('/:id', verificarToken, verificarRol('admin'), actualizarProducto);
router.delete('/:id', verificarToken, verificarRol('admin'), eliminarProducto);
router.patch('/:id/disponibilidad', verificarToken, verificarRol('admin'), cambiarDisponibilidadProducto);

module.exports = router;