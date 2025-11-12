const express = require('express');
const router = express.Router();
const { registrarUsuario, loginUsuario, obtenerPerfil } = require('../controllers/authController');
const { verificarToken } = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);

// Rutas protegidas
router.get('/perfil', verificarToken, obtenerPerfil);

module.exports = router;
