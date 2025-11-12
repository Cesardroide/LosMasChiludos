const express = require('express');
const router = express.Router();
const {
    obtenerMesas,
    obtenerMesaPorId,
    obtenerMesaPorNumero,
    crearMesa,
    actualizarMesa,
    eliminarMesa,
    cambiarEstadoMesa,
    obtenerMesasDisponibles
} = require('../controllers/mesasController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

// Rutas públicas (clientes pueden ver mesas disponibles)
router.get('/disponibles', obtenerMesasDisponibles);

// Rutas que requieren autenticación
router.use(verificarToken);

// Meseros y admins pueden ver todas las mesas
router.get('/', verificarRol('mesero', 'admin'), obtenerMesas);
router.get('/numero/:numero', verificarRol('mesero', 'admin'), obtenerMesaPorNumero);
router.get('/:id', verificarRol('mesero', 'admin'), obtenerMesaPorId);

// Meseros y admins pueden cambiar el estado de las mesas
router.patch('/:id/estado', verificarRol('mesero', 'admin'), cambiarEstadoMesa);

// Solo admins pueden crear, actualizar y eliminar mesas
router.post('/', verificarRol('admin'), crearMesa);
router.put('/:id', verificarRol('admin'), actualizarMesa);
router.delete('/:id', verificarRol('admin'), eliminarMesa);

module.exports = router;