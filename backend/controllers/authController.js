const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
require('dotenv').config();

// Generar JWT
const generarToken = (usuario) => {
    return jwt.sign(
        { 
            id: usuario.id, 
            username: usuario.username,
            email: usuario.email,
            rol: usuario.rol 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

// Registro de usuario
const registrarUsuario = async (req, res) => {
    try {
        const { nombre_completo, username, email, password } = req.body;

        // Validar que todos los campos estén presentes
        if (!nombre_completo || !username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de email inválido'
            });
        }

        // Validar longitud de username
        if (username.length < 4) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario debe tener al menos 4 caracteres'
            });
        }

        // Validar longitud de contraseña
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 8 caracteres'
            });
        }

        // Verificar si el usuario ya existe
        const [usuarioExistente] = await pool.query(
            'SELECT id FROM usuarios WHERE username = ? OR email = ?',
            [username, email]
        );

        if (usuarioExistente.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El nombre de usuario o correo electrónico ya está registrado'
            });
        }

        // Hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insertar nuevo usuario
        const [resultado] = await pool.query(
            'INSERT INTO usuarios (nombre_completo, username, email, password_hash, rol) VALUES (?, ?, ?, ?, ?)',
            [nombre_completo, username, email, password_hash, 'cliente']
        );

        // Obtener el usuario creado
        const [nuevoUsuario] = await pool.query(
            'SELECT id, nombre_completo, username, email, rol, fecha_registro FROM usuarios WHERE id = ?',
            [resultado.insertId]
        );

        // Generar token
        const token = generarToken(nuevoUsuario[0]);

        res.status(201).json({
            success: true,
            message: '¡Registro exitoso! Bienvenido a Los Más Chiludos 🌶️',
            data: {
                token,
                usuario: {
                    id: nuevoUsuario[0].id,
                    nombre_completo: nuevoUsuario[0].nombre_completo,
                    username: nuevoUsuario[0].username,
                    email: nuevoUsuario[0].email,
                    rol: nuevoUsuario[0].rol,
                    fecha_registro: nuevoUsuario[0].fecha_registro
                }
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al registrar usuario',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Login de usuario
const loginUsuario = async (req, res) => {
    try {
        const { userInput, password } = req.body;

        console.log('\n========== INTENTO DE LOGIN ==========');
        console.log('userInput recibido:', userInput);
        console.log('password recibido:', password);
        console.log('password length:', password ? password.length : 0);
        console.log('======================================\n');

        // Validar que los campos estén presentes
        if (!userInput || !password) {
            console.log('❌ Campos vacíos');
            return res.status(400).json({
                success: false,
                message: 'Usuario/correo y contraseña son requeridos'
            });
        }

        // Buscar usuario por username o email
        const [usuarios] = await pool.query(
            'SELECT * FROM usuarios WHERE username = ? OR email = ?',
            [userInput, userInput]
        );

        console.log('Usuarios encontrados:', usuarios.length);
        
        if (usuarios.length === 0) {
            console.log('❌ No se encontró el usuario\n');
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        const usuario = usuarios[0];
        
        console.log('Usuario encontrado:');
        console.log('- ID:', usuario.id);
        console.log('- Username:', usuario.username);
        console.log('- Email:', usuario.email);
        console.log('- Rol:', usuario.rol);
        console.log('- Activo:', usuario.activo);
        console.log('- Password hash (primeros 30 chars):', usuario.password_hash.substring(0, 30) + '...');

        // Verificar si el usuario está activo
        if (!usuario.activo) {
            console.log('❌ Usuario inactivo\n');
            return res.status(403).json({
                success: false,
                message: 'Usuario desactivado. Contacta al administrador'
            });
        }

        // Verificar contraseña
        console.log('\n🔐 Comparando contraseña...');
        console.log('Password ingresada:', password);
        console.log('Hash en BD:', usuario.password_hash);
        
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);
        
        console.log('¿Contraseña válida?', passwordValida ? '✅ SÍ' : '❌ NO');

        if (!passwordValida) {
            console.log('❌ Contraseña incorrecta\n');
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        // Generar token
        const token = generarToken(usuario);

        console.log('✅ Login exitoso para:', usuario.username);
        console.log('======================================\n');

        res.status(200).json({
            success: true,
            message: '¡Inicio de sesión exitoso! 🌶️',
            data: {
                token,
                usuario: {
                    id: usuario.id,
                    nombre_completo: usuario.nombre_completo,
                    username: usuario.username,
                    email: usuario.email,
                    rol: usuario.rol
                }
            }
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al iniciar sesión',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener perfil de usuario (requiere autenticación)
const obtenerPerfil = async (req, res) => {
    try {
        // El middleware de autenticación ya verificó el token y agregó req.usuario
        const [usuarios] = await pool.query(
            'SELECT id, nombre_completo, username, email, rol, fecha_registro FROM usuarios WHERE id = ?',
            [req.usuario.id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                usuario: usuarios[0]
            }
        });

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    registrarUsuario,
    loginUsuario,
    obtenerPerfil
};