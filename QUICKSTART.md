# 🚀 Guía Rápida de Inicio - Los Más Chiludos

## Pasos para echar a andar el sistema HOY

### 1️⃣ Instalar MySQL (si no lo tienes)

**Windows:**
- Descarga MySQL: https://dev.mysql.com/downloads/installer/
- Instala MySQL Server y MySQL Workbench
- Durante la instalación, establece una contraseña para el usuario root

**Mac:**
```bash
brew install mysql
brew services start mysql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

### 2️⃣ Configurar la Base de Datos

Abre tu terminal/consola y ejecuta:

```bash
# Acceder a MySQL
mysql -u root -p
# Te pedirá tu contraseña de MySQL
```

Dentro de MySQL, ejecuta:

```sql
# Crear la base de datos
CREATE DATABASE los_mas_chiludos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Salir de MySQL
exit;
```

Ahora importa las tablas:

```bash
# Desde la carpeta del proyecto
cd LosMasChiludos/backend
mysql -u root -p los_mas_chiludos < database.sql
```

### 3️⃣ Configurar el Backend

```bash
# Ir a la carpeta backend
cd backend

# Instalar dependencias (toma 1-2 minutos)
npm install

# Editar el archivo .env con tus datos de MySQL
# Abre backend/.env y cambia:
# DB_PASSWORD=tu_contraseña_de_mysql
```

### 4️⃣ Iniciar el Servidor

```bash
# Desde la carpeta backend
npm start
```

Deberías ver algo como:

```
🌶️  ========================================
   LOS MÁS CHILUDOS - Backend Server
   ========================================
   🚀 Servidor corriendo en: http://localhost:3000
   📁 Frontend disponible en: http://localhost:3000/login.html
   ========================================
```

### 5️⃣ Probar el Sistema

Abre tu navegador en: **http://localhost:3000/login.html**

#### 🧪 Prueba 1: Login con Usuario Administrador

Ya existe un usuario admin creado:
- **Usuario:** admin
- **Contraseña:** admin123

#### 🧪 Prueba 2: Registrar un Nuevo Usuario

1. Haz clic en "Regístrate aquí"
2. Llena el formulario:
   - Nombre completo: Tu Nombre
   - Username: tunombre123
   - Email: tu@email.com
   - Contraseña: password123 (mínimo 8 caracteres)
3. Acepta términos y condiciones
4. Haz clic en "Registrarse"

Si todo funciona, verás un mensaje de éxito y serás redirigido a inicio.html

### 6️⃣ Verificar en la Base de Datos (Opcional)

```bash
mysql -u root -p
```

```sql
USE los_mas_chiludos;
SELECT * FROM usuarios;
```

Deberías ver tu nuevo usuario registrado.

## ✅ Lista de Verificación

- [ ] MySQL instalado y corriendo
- [ ] Base de datos creada
- [ ] Tablas importadas (database.sql)
- [ ] Dependencias instaladas (npm install)
- [ ] Archivo .env configurado
- [ ] Servidor corriendo (npm start)
- [ ] Login funciona
- [ ] Registro funciona

## ❌ Problemas Comunes

### "Cannot connect to MySQL"
- Verifica que MySQL esté corriendo
- Revisa usuario/contraseña en .env
- Asegúrate de que el puerto sea 3306

### "Database does not exist"
- Ejecuta: `mysql -u root -p < backend/database.sql`

### "Port 3000 already in use"
- Cambia el puerto en backend/.env: `PORT=3001`
- O detén el proceso usando el puerto 3000

### "npm: command not found"
- Instala Node.js desde: https://nodejs.org/

## 📱 URLs Importantes

- Login: http://localhost:3000/login.html
- Registro: http://localhost:3000/registro.html
- API Health: http://localhost:3000/api/health
- API Info: http://localhost:3000/api

## 🎉 ¡Listo!

Ahora tienes el sistema de login y registro funcionando completamente.

## 🔜 Próximos Pasos

Una vez que el login y registro funcionen:
1. Verificar que los tokens se guarden correctamente
2. Agregar validación de sesión en las demás páginas
3. Implementar el sistema de roles (admin, mesero, cliente)
4. Continuar con las siguientes funcionalidades del proyecto

## 💡 Tips

- El token JWT se guarda en localStorage
- Usa las DevTools del navegador (F12) para ver errores
- Revisa la consola del servidor para logs
- Los usuarios se crean con rol "cliente" por defecto

---

¿Necesitas ayuda? Revisa el README.md completo para más detalles.
