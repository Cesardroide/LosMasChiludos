const express = require('express');
const router = express.Router();
const {
    crearReservacion,
    obtenerReservaciones,
    obtenerReservacionPorId,
    actualizarEstadoReservacion,
    obtenerMisReservaciones,
    cancelarReservacion,
    completarReservacion
} = require('../controllers/reservacionesController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

// Rutas protegidas (requieren autenticación)

// Clientes pueden crear reservaciones y ver sus propias reservaciones
router.post('/', verificarToken, crearReservacion);
router.get('/mis-reservaciones', verificarToken, obtenerMisReservaciones);
router.patch('/:id/cancelar', verificarToken, cancelarReservacion);

// Meseros y admins pueden ver todas las reservaciones
router.get('/', verificarToken, verificarRol('mesero', 'admin'), obtenerReservaciones);
router.get('/:id', verificarToken, verificarRol('mesero', 'admin'), obtenerReservacionPorId);

// Solo meseros y admins pueden actualizar estado de reservaciones
router.patch('/:id/estado', verificarToken, verificarRol('mesero', 'admin'), actualizarEstadoReservacion);

// Meseros y admins pueden completar reservaciones (liberar mesas)
router.patch('/:id/completar', verificarToken, verificarRol('mesero', 'admin'), completarReservacion);

module.exports = router;