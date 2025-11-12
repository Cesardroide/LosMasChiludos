const express = require('express');
const router = express.Router();
const {
    obtenerEmpleados,
    obtenerEmpleadoPorId,
    crearEmpleado,
    actualizarEmpleado,
    eliminarEmpleado,
    cambiarEstadoEmpleado
} = require('../controllers/empleadosController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación y rol de admin
router.use(verificarToken);
router.use(verificarRol('admin'));

// Rutas de empleados
router.get('/', obtenerEmpleados);
router.get('/:id', obtenerEmpleadoPorId);
router.post('/', crearEmpleado);
router.put('/:id', actualizarEmpleado);
router.delete('/:id', eliminarEmpleado);
router.patch('/:id/estado', cambiarEstadoEmpleado);

module.exports = router;