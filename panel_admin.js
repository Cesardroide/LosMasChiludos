// Configuración de la API
const API_URL = 'http://localhost:3000/api';

// Obtener token del localStorage
const getToken = () => {
    return localStorage.getItem('token');
};

// Función para hacer peticiones autenticadas
const fetchConToken = async (url, options = {}) => {
    const token = getToken();
    
    if (!token) {
        alert('No hay sesión activa. Redirigiendo al login...');
        window.location.href = 'login_personal.html';
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            alert('Sesión expirada. Por favor inicia sesión nuevamente.');
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = 'login_personal.html';
            return;
        }

        return response;
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
};

// ============================================
// EMPLEADOS
// ============================================

// Cargar empleados
const cargarEmpleados = async () => {
    try {
        const response = await fetchConToken(`${API_URL}/empleados`);
        const data = await response.json();

        if (data.success) {
            mostrarEmpleados(data.data);
        } else {
            console.error('Error al cargar empleados:', data.message);
        }
    } catch (error) {
        console.error('Error al cargar empleados:', error);
    }
};

// Mostrar empleados en el DOM
const mostrarEmpleados = (empleados) => {
    const contenedor = document.getElementById('empleadosLista');
    if (!contenedor) return;

    if (empleados.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center; color: #666;">No hay empleados registrados</p>';
        // Actualizar contador a 0
        const totalEmployeesElement = document.getElementById('totalEmployees');
        if (totalEmployeesElement) {
            totalEmployeesElement.textContent = '0';
        }
        return;
    }

    contenedor.innerHTML = empleados.map(emp => `
        <div class="card">
            <div class="card-header">
                <div class="card-title">${emp.nombre_completo}</div>
                <span class="badge ${emp.activo ? 'badge-active' : 'badge-inactive'}">
                    ${emp.activo ? 'Activo' : 'Inactivo'}
                </span>
            </div>
            <div class="card-content">
                🆔 ${emp.codigo_empleado}<br>
                💼 ${emp.puesto.charAt(0).toUpperCase() + emp.puesto.slice(1)}<br>
                📧 ${emp.email}<br>
                👤 Usuario: ${emp.username}
            </div>
            <div class="card-actions">
                <button class="btn-secondary" onclick="editarEmpleado(${emp.id})">✏️ Editar</button>
                <button class="btn-danger" onclick="eliminarEmpleado(${emp.id}, '${emp.nombre_completo}')">🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');

    // Actualizar contador
    const totalEmployeesElement = document.getElementById('totalEmployees');
    if (totalEmployeesElement) {
        totalEmployeesElement.textContent = empleados.length;
    }
};

// Crear empleado
document.getElementById('createEmployeeForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const nombre_completo = document.getElementById('employeeName').value;
    const puesto = document.getElementById('employeePosition').value;
    const username = document.getElementById('employeeName').value.toLowerCase().replace(/\s+/g, '');
    const email = `${username}@loschilu.com`;
    
    // Generar contraseña
    const password = generarPassword();
    
    console.log('=== CREANDO EMPLEADO ===');
    console.log('Nombre:', nombre_completo);
    console.log('Username:', username);
    console.log('Contraseña generada:', password);
    console.log('========================');

    try {
        const bodyData = {
            nombre_completo,
            username,
            email,
            password,
            puesto,
            salario: null,
            fecha_contratacion: new Date().toISOString().split('T')[0]
        };
        
        console.log('Datos a enviar:', bodyData);

        const response = await fetchConToken(`${API_URL}/empleados`, {
            method: 'POST',
            body: JSON.stringify(bodyData)
        });

        const data = await response.json();
        
        console.log('Respuesta del servidor:', data);

        if (data.success) {
            const puestoTexto = puesto === 'admin' ? '👨‍💼 Administrador' : '🍽️ Mesero';
            const confirmation = `
✅ EMPLEADO CREADO EXITOSAMENTE

━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DATOS DEL EMPLEADO
━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Nombre: ${data.data.nombre_completo}
💼 Puesto: ${puestoTexto}
🆔 Código Interno: ${data.data.codigo_empleado}

━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 CREDENCIALES PARA LOGIN
━━━━━━━━━━━━━━━━━━━━━━━━━

Para acceder al sistema, el empleado debe usar:

📝 ID de Empleado: ${data.data.username}
🔒 Contraseña: ${data.data.password_temporal}
💼 Puesto: ${puestoTexto}

━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANTE:
En el formulario de "Login Personal", el empleado debe:
1. Escribir "${data.data.username}" en "ID de Empleado"
2. Escribir "${data.data.password_temporal}" en "Contraseña"
3. Seleccionar "${puestoTexto}" en "Puesto"

¡Guarda estos datos y entrégalos al empleado de forma segura!
            `;

            console.log('Contraseña que debe usar:', data.data.password_temporal);
            alert(confirmation);
            this.reset();
            cargarEmpleados();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error al crear empleado:', error);
        alert('Error al crear empleado. Intenta nuevamente.');
    }
});

// Eliminar empleado
const eliminarEmpleado = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar al empleado?\n\nNombre: ${nombre}\n\nEsta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await fetchConToken(`${API_URL}/empleados/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ Empleado eliminado\n\nEl empleado ${nombre} ha sido dado de baja del sistema.`);
            cargarEmpleados();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error al eliminar empleado:', error);
        alert('Error al eliminar empleado. Intenta nuevamente.');
    }
};

// Editar empleado (placeholder por ahora)
const editarEmpleado = (id) => {
    alert(`✏️ EDITAR EMPLEADO\n\nEsta función permitirá modificar:\n• Nombre\n• Puesto\n• Contraseña\n• Estado (Activo/Inactivo)\n\n[Próximamente con modal de edición]`);
};

// ============================================
// PRODUCTOS
// ============================================

// Cargar productos
const cargarProductos = async () => {
    try {
        const response = await fetch(`${API_URL}/productos`);
        const data = await response.json();

        if (data.success) {
            mostrarProductos(data.data);
        } else {
            console.error('Error al cargar productos:', data.message);
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
};

// Mostrar productos en el DOM
const mostrarProductos = (productos) => {
    const contenedor = document.getElementById('productosLista');
    if (!contenedor) return;

    if (productos.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center; color: #666;">No hay productos registrados</p>';
        // Actualizar contador a 0
        const totalProductsElement = document.getElementById('totalProducts');
        if (totalProductsElement) {
            totalProductsElement.textContent = '0';
        }
        return;
    }

    const categoriasNombres = {
        'entrada': 'Entrada',
        'plato_fuerte': 'Plato Fuerte',
        'postre': 'Postre',
        'bebida': 'Bebida',
        'otros': 'Otros'
    };

    const picanteIcons = {
        'sin_picante': '',
        'poco': '🌶️',
        'medio': '🌶️🌶️',
        'muy_picante': '🌶️🌶️🌶️',
        'extremo': '🌶️🌶️🌶️🌶️'
    };

    contenedor.innerHTML = productos.map(prod => `
        <div class="card">
            <div class="card-header">
                <div class="card-title">${prod.nombre}</div>
                <span class="badge ${prod.disponible ? 'badge-active' : 'badge-inactive'}">
                    ${prod.disponible ? 'Disponible' : 'No disponible'}
                </span>
            </div>
            <div class="card-content">
                📁 ${categoriasNombres[prod.categoria]}<br>
                💰 $${prod.precio} MXN<br>
                ${picanteIcons[prod.nivel_picante]} ${prod.nivel_picante.replace('_', ' ')}<br>
                ${prod.descripcion ? `📝 ${prod.descripcion}` : ''}
            </div>
            <div class="card-actions">
                <button class="btn-secondary" onclick="editarProducto(${prod.id})">✏️ Editar</button>
                <button class="btn-danger" onclick="eliminarProducto(${prod.id}, '${prod.nombre}')">🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');

    // Actualizar contador
    const totalProductsElement = document.getElementById('totalProducts');
    if (totalProductsElement) {
        totalProductsElement.textContent = productos.length;
    }
};

// Crear producto
document.getElementById('createProductForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const nombre = document.getElementById('productName').value;
    const categoriaForm = document.getElementById('productCategory').value;
    const precio = parseFloat(document.getElementById('productPrice').value);
    const descripcion = document.getElementById('productDescription').value;
    const nivelPicanteForm = document.getElementById('productSpicy')?.value || '0';

    // Mapear categorías del frontend al backend
    const categoriasMap = {
        'tacos': 'plato_fuerte',
        'tortas': 'plato_fuerte',
        'antojitos': 'entrada',
        'bebidas': 'bebida'
    };

    // Mapear nivel de picante del frontend al backend
    const picanteMap = {
        '0': 'sin_picante',
        '1': 'poco',
        '2': 'medio',
        '3': 'muy_picante'
    };

    const categoria = categoriasMap[categoriaForm] || 'otros';
    const nivel_picante = picanteMap[nivelPicanteForm] || 'sin_picante';

    try {
        const response = await fetchConToken(`${API_URL}/productos`, {
            method: 'POST',
            body: JSON.stringify({
                nombre,
                categoria,
                precio,
                descripcion,
                nivel_picante,
                disponible: true
            })
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ PRODUCTO AGREGADO\n\n${nombre}\n$${precio} MXN\n\nEl producto ha sido agregado al menú exitosamente.`);
            this.reset();
            cargarProductos();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error al crear producto:', error);
        alert('Error al crear producto. Intenta nuevamente.');
    }
});

// Eliminar producto
const eliminarProducto = async (id, nombre) => {
    if (!confirm(`¿Eliminar producto del menú?\n\n${nombre}\n\nEsta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await fetchConToken(`${API_URL}/productos/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ Producto eliminado\n\n${nombre} ha sido removido del menú.`);
            cargarProductos();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        alert('Error al eliminar producto. Intenta nuevamente.');
    }
};

// Editar producto (placeholder)
const editarProducto = (id) => {
    alert(`✏️ EDITAR PRODUCTO\n\nEsta función permitirá modificar:\n• Nombre\n• Categoría\n• Precio\n• Descripción\n• Nivel de picante\n\n[Próximamente con modal de edición]`);
};

// ============================================
// MESAS
// ============================================

// Cargar mesas
const cargarMesas = async () => {
    try {
        const response = await fetchConToken(`${API_URL}/mesas`);
        const data = await response.json();

        if (data.success) {
            mostrarMesas(data.data);
        } else {
            console.error('Error al cargar mesas:', data.message);
        }
    } catch (error) {
        console.error('Error al cargar mesas:', error);
    }
};

// Mostrar mesas en el DOM
const mostrarMesas = (mesas) => {
    const contenedor = document.getElementById('mesasLista');
    if (!contenedor) return;

    if (mesas.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center; color: #666;">No hay mesas registradas</p>';
        // Actualizar contador a 0
        const totalTablesElement = document.getElementById('totalTables');
        if (totalTablesElement) {
            totalTablesElement.textContent = '0';
        }
        return;
    }

    const ubicacionesNombres = {
        'interior': 'Interior',
        'terraza': 'Terraza',
        'vip': 'VIP',
        'barra': 'Barra'
    };

    contenedor.innerHTML = mesas.map(mesa => `
        <div class="card">
            <div class="card-header">
                <div class="card-title">Mesa ${mesa.numero_mesa}</div>
                <span class="badge ${mesa.estado === 'disponible' ? 'badge-active' : 'badge-inactive'}">
                    ${mesa.estado.charAt(0).toUpperCase() + mesa.estado.slice(1)}
                </span>
            </div>
            <div class="card-content">
                📍 Ubicación: ${ubicacionesNombres[mesa.ubicacion]}<br>
                👥 Capacidad: ${mesa.capacidad} personas
            </div>
            <div class="card-actions">
                <button class="btn-secondary" onclick="editarMesa(${mesa.id})">✏️ Editar</button>
                <button class="btn-danger" onclick="eliminarMesa(${mesa.id}, ${mesa.numero_mesa})">🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');

    // Actualizar contador
    const totalTablesElement = document.getElementById('totalTables');
    if (totalTablesElement) {
        totalTablesElement.textContent = mesas.length;
    }
};

// Crear mesa
document.getElementById('createTableForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const numero_mesa = parseInt(document.getElementById('tableNumber').value);
    const capacidad = parseInt(document.getElementById('tableCapacity').value);
    const ubicacion = document.getElementById('tableLocation').value;

    try {
        const response = await fetchConToken(`${API_URL}/mesas`, {
            method: 'POST',
            body: JSON.stringify({
                numero_mesa,
                capacidad,
                ubicacion,
                estado: 'disponible'
            })
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ MESA AGREGADA\n\nMesa ${numero_mesa}\nCapacidad: ${capacidad} personas\n\nLa mesa ha sido agregada al sistema y está disponible para reservaciones.`);
            this.reset();
            cargarMesas();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error al crear mesa:', error);
        alert('Error al crear mesa. Intenta nuevamente.');
    }
});

// Eliminar mesa
const eliminarMesa = async (id, numero) => {
    if (!confirm(`¿Eliminar Mesa ${numero}?\n\nEsta acción no se puede deshacer y la mesa no estará disponible para reservaciones.`)) {
        return;
    }

    try {
        const response = await fetchConToken(`${API_URL}/mesas/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ Mesa eliminada\n\nMesa ${numero} ha sido removida del sistema.`);
            cargarMesas();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error al eliminar mesa:', error);
        alert('Error al eliminar mesa. Intenta nuevamente.');
    }
};

// Editar mesa (placeholder)
const editarMesa = (id) => {
    alert(`✏️ EDITAR MESA\n\nEsta función permitirá modificar:\n• Número de mesa\n• Capacidad\n• Ubicación\n• Estado\n\n[Próximamente con modal de edición]`);
};

// ============================================
// UTILIDADES
// ============================================

// Generar contraseña aleatoria
function generarPassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Logout
function logout() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        alert('Sesión cerrada correctamente\n\nHasta pronto 👋');
        window.location.href = 'login_personal.html';
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

// Cargar datos al inicio
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay sesión activa
    const token = getToken();
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    if (!token || usuario.rol !== 'admin') {
        alert('Acceso denegado. Solo administradores pueden acceder a este panel.');
        window.location.href = 'login_personal.html';
        return;
    }

    // Mostrar información del usuario
    const staffName = document.querySelector('.staff-name');
    if (staffName && usuario.nombre_completo) {
        staffName.textContent = usuario.nombre_completo;
    }

    // Cargar datos iniciales
    cargarEmpleados();
    cargarProductos();
    cargarMesas();
});