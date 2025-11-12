const bcrypt = require('bcryptjs');

// La contraseña que generó el sistema
const password = '51hpje2j';

// Generar el hash (igual que hace el sistema)
bcrypt.hash(password, 10).then(hash => {
    console.log('\n==================================');
    console.log('TEST DE CONTRASEÑA');
    console.log('==================================');
    console.log('Contraseña original:', password);
    console.log('Hash generado:', hash);
    console.log('==================================\n');
    
    // Ahora probar la comparación
    bcrypt.compare(password, hash).then(resultado => {
        console.log('¿La contraseña coincide con el hash?', resultado ? '✅ SÍ' : '❌ NO');
        console.log('\n');
        
        // Ahora pide el hash de la base de datos
        console.log('INSTRUCCIONES:');
        console.log('1. Ve a MySQL y ejecuta:');
        console.log('   SELECT password_hash FROM usuarios WHERE username = "test";');
        console.log('2. Copia el hash completo');
        console.log('3. Reemplaza en la línea 27 de este archivo');
        console.log('4. Ejecuta de nuevo: node test-password.js');
        console.log('\n');
        
        // Probar con el hash de la BD (REEMPLAZA ESTE HASH CON EL DE TU BD)
        const hashDeLaBD = '$2b$10$fejQFdwd2Ru25xx0Y2Ny9O1blDQ8Cxbfr2edqsCl4pNbuXzxhZyfa';
        
        if (hashDeLaBD !== '$2b$10$fejQFdwd2Ru25xx0Y2Ny9O1blDQ8Cxbfr2edqsCl4pNbuXzxhZyfa') {
            bcrypt.compare(password, hashDeLaBD).then(resultado2 => {
                console.log('\n==================================');
                console.log('COMPARACIÓN CON HASH DE LA BD');
                console.log('==================================');
                console.log('Hash de la BD:', hashDeLaBD);
                console.log('¿Coincide?', resultado2 ? '✅ SÍ - El login debería funcionar' : '❌ NO - Hay un problema con el hash guardado');
                console.log('==================================\n');
            });
        }
    });
});