const express = require('express');
const router = express.Router();
const {
    crearPedido,
    obtenerPedidos,
    obtenerPedidoPorId,
    actualizarEstadoPedido,
    obtenerMisPedidos
} = require('../controllers/pedidosController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

// Rutas protegidas (requieren autenticación)

// Clientes pueden crear pedidos y ver sus propios pedidos
router.post('/', verificarToken, crearPedido);
router.get('/mis-pedidos', verificarToken, obtenerMisPedidos);

// Meseros y admins pueden ver todos los pedidos
router.get('/', verificarToken, verificarRol('mesero', 'admin'), obtenerPedidos);
router.get('/:id', verificarToken, verificarRol('mesero', 'admin'), obtenerPedidoPorId);

// Solo meseros y admins pueden actualizar estado de pedidos
router.patch('/:id/estado', verificarToken, verificarRol('mesero', 'admin'), actualizarEstadoPedido);

module.exports = router;