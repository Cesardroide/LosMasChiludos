-- Script para actualizar las contraseñas de los usuarios
-- Ejecuta esto si ya tienes los usuarios creados

USE los_mas_chiludos;

-- Actualizar contraseña del admin
UPDATE usuarios 
SET password_hash = '$2b$10$wCMv2UaBKvnNkPEMjtn1ve4DUXnx8aS5xb/JPRI/atJw4lUGzuaS2'
WHERE username = 'admin';

-- Actualizar o insertar mesero
INSERT INTO usuarios (nombre_completo, username, email, password_hash, rol) 
VALUES ('Juan Mesero', 'mesero1', 'mesero@loschilu.com', '$2b$10$wCMv2UaBKvnNkPEMjtn1ve4DUXnx8aS5xb/JPRI/atJw4lUGzuaS2', 'mesero')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

-- Verificar los usuarios
SELECT id, username, email, rol FROM usuarios WHERE rol IN ('admin', 'mesero');