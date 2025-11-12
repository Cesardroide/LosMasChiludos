# 🌶️ Los Más Chiludos - Sistema de Autenticación

Sistema de autenticación completo para el restaurante "Los Más Chiludos" con backend en Node.js/Express y frontend en HTML/CSS/JavaScript.

## 📋 Características

- ✅ Registro de usuarios normales
- ✅ Login con usuario o correo electrónico
- ✅ Autenticación JWT
- ✅ Contraseñas encriptadas con bcrypt
- ✅ Validación de datos en frontend y backend
- ✅ Protección de rutas
- ✅ Sistema de roles (cliente, mesero, admin)
- ✅ Base de datos MySQL

## 🚀 Requisitos Previos

- Node.js (versión 14 o superior)
- MySQL (versión 5.7 o superior)
- npm o yarn

## 📦 Instalación

### 1. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 2. Configurar la base de datos

1. Asegúrate de que MySQL esté corriendo
2. Edita el archivo `backend/.env` con tus credenciales de MySQL:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=los_mas_chiludos
DB_PORT=3306
```

3. Crear la base de datos:

```bash
mysql -u root -p < backend/database.sql
```

O desde MySQL Workbench/phpMyAdmin, ejecuta el contenido de `backend/database.sql`

### 3. Configurar JWT Secret

En el archivo `backend/.env`, cambia el JWT_SECRET por algo seguro:

```env
JWT_SECRET=tu_secreto_super_seguro_y_aleatorio_aqui
```

## ▶️ Ejecutar el Proyecto

### Iniciar el servidor backend

```bash
cd backend
npm start
```

O para desarrollo con auto-reload:

```bash
npm run dev
```

El servidor correrá en: `http://localhost:3000`

### Acceder al frontend

Una vez el servidor esté corriendo, abre tu navegador en:

- Login: `http://localhost:3000/login.html`
- Registro: `http://localhost:3000/registro.html`

## 🔐 Endpoints de la API

### Autenticación

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/registro` | Registrar nuevo usuario | No |
| POST | `/api/auth/login` | Iniciar sesión | No |
| GET | `/api/auth/perfil` | Obtener perfil de usuario | Sí |

### Ejemplos de uso

#### Registro

```bash
POST http://localhost:3000/api/auth/registro
Content-Type: application/json

{
  "nombre_completo": "Juan Pérez",
  "username": "juanperez",
  "email": "juan@ejemplo.com",
  "password": "password123"
}
```

#### Login

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "userInput": "juanperez",
  "password": "password123"
}
```

#### Obtener Perfil (requiere autenticación)

```bash
GET http://localhost:3000/api/auth/perfil
Authorization: Bearer tu_token_jwt_aqui
```

## 👤 Usuario Administrador por Defecto

El sistema viene con un usuario administrador precargado:

- **Usuario:** admin
- **Correo:** admin@loschilu.com
- **Contraseña:** admin123

## 🗂️ Estructura del Proyecto

```
LosMasChiludos/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuración de MySQL
│   ├── controllers/
│   │   └── authController.js    # Lógica de autenticación
│   ├── middleware/
│   │   └── authMiddleware.js    # Verificación JWT
│   ├── routes/
│   │   └── authRoutes.js        # Rutas de autenticación
│   ├── .env                      # Variables de entorno
│   ├── database.sql              # Script de BD
│   ├── package.json
│   └── server.js                 # Servidor Express
├── login.html                    # Página de login
├── registro.html                 # Página de registro
└── README.md
```

## 🔧 Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **MySQL2** - Cliente de MySQL
- **bcryptjs** - Encriptación de contraseñas
- **jsonwebtoken** - Autenticación JWT
- **cors** - Manejo de CORS
- **dotenv** - Variables de entorno

### Frontend
- **HTML5**
- **CSS3**
- **JavaScript (ES6+)**
- **Fetch API** - Peticiones HTTP

## 🛡️ Seguridad

- Contraseñas hasheadas con bcrypt (10 salt rounds)
- Tokens JWT con expiración configurable
- Validación de datos en frontend y backend
- Protección contra inyección SQL (prepared statements)
- CORS configurado
- Variables de entorno para datos sensibles

## 📝 Validaciones

### Registro
- Nombre completo: mínimo 3 caracteres
- Username: mínimo 4 caracteres, único
- Email: formato válido, único
- Contraseña: mínimo 8 caracteres

### Login
- Usuario/Email: requerido
- Contraseña: requerida
- Usuario debe estar activo

## 🚧 Próximas Funcionalidades

- [ ] Recuperación de contraseña
- [ ] Verificación de email
- [ ] Refresh tokens
- [ ] Rate limiting
- [ ] Logs de auditoría
- [ ] Panel de administración completo

## 🐛 Solución de Problemas

### Error de conexión a MySQL

```
❌ Error al conectar con la base de datos
```

**Solución:**
1. Verifica que MySQL esté corriendo
2. Revisa las credenciales en `.env`
3. Asegúrate de que la base de datos exista

### Error CORS

```
Access to fetch has been blocked by CORS policy
```

**Solución:**
- Asegúrate de que el servidor backend esté corriendo
- Verifica la configuración de CORS en `server.js`

### Token inválido

```
Token inválido o expirado
```

**Solución:**
- Inicia sesión nuevamente
- Verifica que el JWT_SECRET sea el mismo en el servidor

## 📄 Licencia

Este proyecto es privado y propiedad de Los Más Chiludos.

## 👨‍💻 Desarrollador

Desarrollado con ❤️ y 🌶️ para Los Más Chiludos

---

¿Preguntas? Contacta al equipo de desarrollo.
