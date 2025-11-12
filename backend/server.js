const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const empleadosRoutes = require('./routes/empleadosRoutes');
const productosRoutes = require('./routes/productosRoutes');
const mesasRoutes = require('./routes/mesasRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes');
const reservacionesRoutes = require('./routes/reservacionesRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/reservaciones', reservacionesRoutes);

// Ruta raíz de la API
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: '🌶️ API de Los Más Chiludos',
        version: '1.0.0',
        endpoints: {
            auth: {
                registro: 'POST /api/auth/registro',
                login: 'POST /api/auth/login',
                perfil: 'GET /api/auth/perfil (requiere autenticación)'
            },
            empleados: {
                listar: 'GET /api/empleados (requiere admin)',
                obtener: 'GET /api/empleados/:id (requiere admin)',
                crear: 'POST /api/empleados (requiere admin)',
                actualizar: 'PUT /api/empleados/:id (requiere admin)',
                eliminar: 'DELETE /api/empleados/:id (requiere admin)',
                cambiarEstado: 'PATCH /api/empleados/:id/estado (requiere admin)'
            },
            productos: {
                listar: 'GET /api/productos',
                obtener: 'GET /api/productos/:id',
                porCategoria: 'GET /api/productos/categoria/:categoria',
                crear: 'POST /api/productos (requiere admin)',
                actualizar: 'PUT /api/productos/:id (requiere admin)',
                eliminar: 'DELETE /api/productos/:id (requiere admin)',
                cambiarDisponibilidad: 'PATCH /api/productos/:id/disponibilidad (requiere admin)'
            },
            mesas: {
                listar: 'GET /api/mesas (requiere autenticación)',
                disponibles: 'GET /api/mesas/disponibles',
                obtener: 'GET /api/mesas/:id (requiere autenticación)',
                porNumero: 'GET /api/mesas/numero/:numero (requiere autenticación)',
                crear: 'POST /api/mesas (requiere admin)',
                actualizar: 'PUT /api/mesas/:id (requiere admin)',
                eliminar: 'DELETE /api/mesas/:id (requiere admin)',
                cambiarEstado: 'PATCH /api/mesas/:id/estado (requiere autenticación)'
            },
            pedidos: {
                crear: 'POST /api/pedidos (requiere autenticación)',
                misPedidos: 'GET /api/pedidos/mis-pedidos (requiere autenticación)',
                listar: 'GET /api/pedidos (requiere mesero/admin)',
                obtener: 'GET /api/pedidos/:id (requiere mesero/admin)',
                actualizarEstado: 'PATCH /api/pedidos/:id/estado (requiere mesero/admin)'
            },
            reservaciones: {
                crear: 'POST /api/reservaciones (requiere autenticación)',
                misReservaciones: 'GET /api/reservaciones/mis-reservaciones (requiere autenticación)',
                listar: 'GET /api/reservaciones (requiere mesero/admin)',
                obtener: 'GET /api/reservaciones/:id (requiere mesero/admin)',
                actualizarEstado: 'PATCH /api/reservaciones/:id/estado (requiere mesero/admin)',
                cancelar: 'PATCH /api/reservaciones/:id/cancelar (requiere autenticación)'
            }
        }
    });
});

// Ruta para verificar el estado del servidor
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Manejo de rutas no encontradas
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Manejo global de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Iniciar servidor
const iniciarServidor = async () => {
    try {
        // Probar conexión a la base de datos
        const dbConectada = await testConnection();
        
        if (!dbConectada) {
            console.error('❌ No se pudo conectar a la base de datos');
            console.log('\n📋 Pasos para solucionar:');
            console.log('1. Asegúrate de que MySQL esté corriendo');
            console.log('2. Verifica las credenciales en el archivo .env');
            console.log('3. Ejecuta el script database.sql para crear la base de datos');
            console.log('   mysql -u root -p < backend/database.sql\n');
            process.exit(1);
        }

        app.listen(PORT, () => {
            console.log('\n🌶️  ========================================');
            console.log('   LOS MÁS CHILUDOS - Backend Server');
            console.log('   ========================================');
            console.log(`   🚀 Servidor corriendo en: http://localhost:${PORT}`);
            console.log(`   🏠 Frontend disponible en: http://localhost:${PORT}/login.html`);
            console.log(`   🔗 API Base: http://localhost:${PORT}/api`);
            console.log(`   📚 Documentación API: http://localhost:${PORT}/api`);
            console.log('\n   📋 RUTAS DISPONIBLES:');
            console.log('   ────────────────────────────────────────');
            console.log('   🔐 Autenticación:');
            console.log('      - POST /api/auth/registro');
            console.log('      - POST /api/auth/login');
            console.log('      - GET  /api/auth/perfil');
            console.log('\n   👥 Empleados (Admin):');
            console.log('      - GET    /api/empleados');
            console.log('      - POST   /api/empleados');
            console.log('      - PUT    /api/empleados/:id');
            console.log('      - DELETE /api/empleados/:id');
            console.log('\n   🍽️  Productos:');
            console.log('      - GET    /api/productos');
            console.log('      - POST   /api/productos (Admin)');
            console.log('      - PUT    /api/productos/:id (Admin)');
            console.log('      - DELETE /api/productos/:id (Admin)');
            console.log('\n   🪑 Mesas:');
            console.log('      - GET    /api/mesas');
            console.log('      - GET    /api/mesas/disponibles');
            console.log('      - POST   /api/mesas (Admin)');
            console.log('      - PATCH  /api/mesas/:id/estado');
            console.log('\n   🛒 Pedidos:');
            console.log('      - POST   /api/pedidos (Cliente)');
            console.log('      - GET    /api/pedidos (Mesero/Admin)');
            console.log('      - GET    /api/pedidos/mis-pedidos (Cliente)');
            console.log('      - PATCH  /api/pedidos/:id/estado (Mesero/Admin)');
            console.log('\n   📅 Reservaciones:');
            console.log('      - POST   /api/reservaciones (Cliente)');
            console.log('      - GET    /api/reservaciones (Mesero/Admin)');
            console.log('      - GET    /api/reservaciones/mis-reservaciones (Cliente)');
            console.log('      - PATCH  /api/reservaciones/:id/estado (Mesero/Admin)');
            console.log('   ========================================\n');
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Manejar cierre graceful
process.on('SIGTERM', () => {
    console.log('👋 Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n👋 Cerrando servidor...');
    process.exit(0);
});

iniciarServidor();

module.exports = app;