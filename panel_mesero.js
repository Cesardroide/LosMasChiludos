// Configuración de la API
const API_URL = 'http://localhost:3000/api';

// Obtener token del localStorage
const getToken = () => {
    return localStorage.getItem('token');
};

// Función para hacer peticiones autenticadas
const fetchConToken = async (url, options = {}) => {
    const token = getToken();
    
    console.log('🔐 Intentando petición a:', url);
    console.log('🔑 Token:', token ? 'Existe ✅' : 'NO EXISTE ❌');
    
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
    
    console.log('📨 Headers enviados:', headers);

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        console.log('📥 Respuesta del servidor:', response.status, response.statusText);

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

// Cargar pedidos del día
async function cargarPedidos() {
    try {
        // Obtener fecha en formato YYYY-MM-DD considerando zona horaria local
        const ahora = new Date();
        const año = ahora.getFullYear();
        const mes = String(ahora.getMonth() + 1).padStart(2, '0');
        const dia = String(ahora.getDate()).padStart(2, '0');
        const hoy = `${año}-${mes}-${dia}`;
        
        console.log('📅 Fecha local para buscar pedidos:', hoy);
        
        // Debug: verificar token
        const token = getToken();
        console.log('🔑 Token al cargar pedidos:', token ? 'Existe' : 'NO EXISTE');
        
        const response = await fetchConToken(`${API_URL}/pedidos?fecha=${hoy}`);
        
        if (!response) {
            console.error('❌ No se obtuvo respuesta del servidor');
            return;
        }
        
        const data = await response.json();
        console.log('📦 Respuesta de pedidos:', data);

        if (data.success) {
            mostrarPedidos(data.data);
            actualizarEstadisticas(data.data);
        } else {
            console.error('Error al cargar pedidos:', data.message);
        }
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
    }
}

// Mostrar pedidos en la tabla
function mostrarPedidos(pedidos) {
    const tbody = document.querySelector('.orders-table tbody');
    
    if (!tbody) return;

    if (pedidos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div style="color: #999;">
                        <div style="font-size: 48px; margin-bottom: 10px;">📋</div>
                        <div style="font-size: 18px; font-weight: 600;">No hay pedidos activos</div>
                        <div style="font-size: 14px; margin-top: 5px;">Los pedidos del día aparecerán aquí</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';

    pedidos.forEach(pedido => {
        const estadoClass = {
            'pendiente': 'status-pending',
            'en_preparacion': 'status-preparing',
            'listo': 'status-ready',
            'entregado': 'status-delivered',
            'pagado': 'status-delivered',
            'cancelado': 'status-cancelled'
        }[pedido.estado] || 'status-pending';

        const estadoTexto = {
            'pendiente': 'Pendiente',
            'en_preparacion': 'En Preparación',
            'listo': 'Listo',
            'entregado': 'Entregado',
            'pagado': 'Pagado',
            'cancelado': 'Cancelado'
        }[pedido.estado] || pedido.estado;

        const hora = new Date(pedido.fecha_pedido).toLocaleTimeString('es-MX', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        let itemsList = '';
        if (pedido.items && pedido.items.length > 0) {
            itemsList = pedido.items.map(item => 
                `• ${item.cantidad}x ${item.producto_nombre}`
            ).join('<br>');
        }

        const row = `
            <tr>
                <td><span class="order-number">#${String(pedido.id).padStart(3, '0')}</span></td>
                <td><span class="table-badge">Mesa ${pedido.numero_mesa || 'N/A'}</span></td>
                <td>
                    <div class="items-list">${itemsList || 'Sin items'}</div>
                </td>
                <td><span class="price">$${pedido.total} MXN</span></td>
                <td><span class="status-badge ${estadoClass}">${estadoTexto}</span></td>
                <td><div class="time-info">${hora}</div></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-details" onclick="viewOrderDetails(${pedido.id})">Ver Detalles</button>
                        ${pedido.estado !== 'pagado' && pedido.estado !== 'cancelado' ? 
                            `<button class="btn-finish" onclick="finishOrder(${pedido.id}, 'Mesa ${pedido.numero_mesa || 'N/A'}')">✓ Finalizar</button>` 
                            : ''}
                    </div>
                </td>
            </tr>
        `;

        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// Cargar reservaciones del día
async function cargarReservaciones() {
    try {
        // Obtener fecha en formato YYYY-MM-DD considerando zona horaria local
        const ahora = new Date();
        const año = ahora.getFullYear();
        const mes = String(ahora.getMonth() + 1).padStart(2, '0');
        const dia = String(ahora.getDate()).padStart(2, '0');
        const hoy = `${año}-${mes}-${dia}`;
        
        console.log('📅 Cargando reservaciones para:', hoy);
        const response = await fetchConToken(`${API_URL}/reservaciones?fecha=${hoy}`);
        
        if (!response) {
            console.error('❌ No se obtuvo respuesta del servidor');
            return;
        }
        
        const data = await response.json();
        console.log('📅 Respuesta de reservaciones:', data);

        if (data.success) {
            mostrarReservaciones(data.data);
        } else {
            console.error('Error al cargar reservaciones:', data.message);
        }
    } catch (error) {
        console.error('Error al cargar reservaciones:', error);
    }
}

// Mostrar reservaciones
function mostrarReservaciones(reservaciones) {
    const container = document.querySelector('.reservations-grid');
    
    if (!container) return;

    // Actualizar estadísticas
    actualizarEstadisticasReservaciones(reservaciones);

    if (reservaciones.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">📅</div>
                <h3>No hay reservaciones para hoy</h3>
                <p>Las reservaciones del día aparecerán aquí</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    reservaciones.forEach(reservacion => {
        const estadoClass = {
            'confirmada': 'status-confirmed',
            'en_curso': 'status-active',
            'completada': 'status-completed',
            'cancelada': 'status-cancelled',
            'no_asistio': 'status-cancelled'
        }[reservacion.estado] || 'status-confirmed';

        const estadoTexto = {
            'confirmada': 'Confirmada',
            'en_curso': 'En Curso',
            'completada': 'Completada',
            'cancelada': 'Cancelada',
            'no_asistio': 'No Asistió'
        }[reservacion.estado] || reservacion.estado;

        const fechaObj = new Date(reservacion.fecha_reservacion + 'T00:00:00');
        const fechaFormateada = fechaObj.toLocaleDateString('es-MX', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });

        const card = `
            <div class="reservation-card">
                <div class="reservation-header">
                    <div class="reservation-name">${reservacion.nombre_completo}</div>
                    <span class="status-badge ${estadoClass}">${estadoTexto}</span>
                </div>
                <div class="reservation-info">
                    <div class="info-row">
                        <span class="info-icon">🪑</span>
                        <span><strong>Mesa ${reservacion.numero_mesa}</strong> (${reservacion.mesa_capacidad} personas)</span>
                    </div>
                    <div class="info-row">
                        <span class="info-icon">📅</span>
                        <span>${fechaFormateada}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-icon">🕐</span>
                        <span>${reservacion.hora_reservacion} hrs</span>
                    </div>
                    <div class="info-row">
                        <span class="info-icon">📱</span>
                        <span>${reservacion.telefono}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-icon">💬</span>
                        <span>${reservacion.comentarios || 'Sin comentarios'}</span>
                    </div>
                </div>
                <button class="btn-details" style="width: 100%; margin-top: 15px;" onclick="viewReservationDetails(${reservacion.id})">
                    Ver Detalles Completos
                </button>
                ${(reservacion.estado === 'confirmada' || reservacion.estado === 'en_curso') ? 
                    `<button class="btn-free-table" onclick="freeTable(${reservacion.id}, ${reservacion.mesa_id}, '${reservacion.nombre_completo}')">
                        🔓 Liberar Mesa
                    </button>` 
                    : ''}
            </div>
        `;

        container.insertAdjacentHTML('beforeend', card);
    });
}

// Actualizar estadísticas
function actualizarEstadisticas(pedidos) {
    const pedidosActivos = pedidos.filter(p => 
        p.estado !== 'pagado' && p.estado !== 'cancelado'
    ).length;

    const statsElements = document.querySelectorAll('.stat-number');
    if (statsElements[0]) statsElements[0].textContent = pedidosActivos;
    
    // Las reservaciones y mesas ocupadas se actualizarán cuando se carguen
}

// Actualizar estadísticas de reservaciones
function actualizarEstadisticasReservaciones(reservaciones) {
    const reservacionesHoy = reservaciones.filter(r => 
        r.estado !== 'cancelada' && r.estado !== 'completada'
    ).length;
    
    const statsElements = document.querySelectorAll('.stat-number');
    if (statsElements[1]) statsElements[1].textContent = reservacionesHoy;
}

// Cargar mesas ocupadas para las estadísticas
async function cargarMesasOcupadas() {
    try {
        const response = await fetchConToken(`${API_URL}/mesas`);
        
        if (!response) return;
        
        const data = await response.json();
        
        if (data.success) {
            const mesasOcupadas = data.data.filter(m => 
                m.estado === 'ocupada' || m.estado === 'reservada'
            ).length;
            
            const statsElements = document.querySelectorAll('.stat-number');
            if (statsElements[2]) statsElements[2].textContent = mesasOcupadas;
        }
    } catch (error) {
        console.error('Error al cargar mesas:', error);
    }
}

// Ver detalles del pedido
async function viewOrderDetails(orderId) {
    try {
        const response = await fetchConToken(`${API_URL}/pedidos/${orderId}`);
        const data = await response.json();

        if (data.success) {
            const pedido = data.data;
            let detalles = `📋 DETALLES DEL PEDIDO #${String(pedido.id).padStart(3, '0')}\n\n`;
            detalles += `Mesa: ${pedido.numero_mesa || 'N/A'}\n`;
            detalles += `Cliente: ${pedido.cliente_nombre}\n`;
            detalles += `Estado: ${pedido.estado}\n`;
            detalles += `Fecha: ${new Date(pedido.fecha_pedido).toLocaleString('es-MX')}\n\n`;
            detalles += `━━━━━━━━━━━━━━━━━━━━\nPRODUCTOS\n━━━━━━━━━━━━━━━━━━━━\n\n`;
            
            pedido.items.forEach(item => {
                detalles += `• ${item.cantidad}x ${item.producto_nombre}\n`;
                detalles += `  $${item.precio_unitario} c/u = $${item.subtotal}\n`;
                if (item.preferencias) {
                    detalles += `  📝 ${item.preferencias}\n`;
                }
                detalles += `\n`;
            });

            detalles += `━━━━━━━━━━━━━━━━━━━━\n`;
            detalles += `TOTAL: $${pedido.total} MXN\n`;

            alert(detalles);
        }
    } catch (error) {
        console.error('Error al obtener detalles:', error);
        alert('Error al cargar los detalles del pedido');
    }
}

// Ver detalles de la reservación
async function viewReservationDetails(reservacionId) {
    try {
        const response = await fetchConToken(`${API_URL}/reservaciones/${reservacionId}`);
        const data = await response.json();

        if (data.success) {
            const res = data.data;
            const fechaObj = new Date(res.fecha_reservacion + 'T00:00:00');
            const fechaFormateada = fechaObj.toLocaleDateString('es-MX', { 
                weekday: 'long',
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
            });

            let detalles = `📅 DETALLES DE RESERVACIÓN #${res.id}\n\n`;
            detalles += `━━━━━━━━━━━━━━━━━━━━\n`;
            detalles += `👤 Cliente: ${res.nombre_completo}\n`;
            detalles += `📱 Teléfono: ${res.telefono}\n`;
            detalles += `📧 Email: ${res.email || 'No proporcionado'}\n\n`;
            detalles += `🪑 Mesa: Mesa ${res.numero_mesa} (${res.mesa_capacidad} personas)\n`;
            detalles += `👥 Comensales: ${res.numero_personas}\n\n`;
            detalles += `📅 Fecha: ${fechaFormateada}\n`;
            detalles += `🕐 Hora: ${res.hora_reservacion}\n\n`;
            detalles += `💬 Comentarios: ${res.comentarios || 'Sin comentarios'}\n\n`;
            detalles += `📊 Estado: ${res.estado}\n`;
            detalles += `━━━━━━━━━━━━━━━━━━━━\n`;

            alert(detalles);
        }
    } catch (error) {
        console.error('Error al obtener detalles:', error);
        alert('Error al cargar los detalles de la reservación');
    }
}

// Finalizar pedido
async function finishOrder(orderId, mesaInfo) {
    if (!confirm(`¿Finalizar el pedido #${String(orderId).padStart(3, '0')} de ${mesaInfo}?\n\nEsto marcará el pedido como pagado.`)) {
        return;
    }

    try {
        const response = await fetchConToken(`${API_URL}/pedidos/${orderId}/estado`, {
            method: 'PATCH',
            body: JSON.stringify({ estado: 'pagado' })
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ PEDIDO FINALIZADO\n\nPedido #${String(orderId).padStart(3, '0')} - ${mesaInfo}\nEstado: Pagado`);
            cargarPedidos(); // Recargar pedidos
        } else {
            alert(`❌ Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error al finalizar pedido:', error);
        alert('Error al finalizar el pedido');
    }
}

// Liberar mesa
async function freeTable(reservacionId, mesaId, customerName) {
    if (!confirm(`¿Liberar la mesa?\n\nCliente: ${customerName}\n\nEsto marcará la reservación como completada y la mesa como disponible.`)) {
        return;
    }

    try {
        console.log(`🔓 Liberando mesa, reservación #${reservacionId}`);
        
        // Usar el nuevo endpoint /completar que libera la mesa automáticamente
        const response = await fetchConToken(`${API_URL}/reservaciones/${reservacionId}/completar`, {
            method: 'PATCH'
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ MESA LIBERADA\n\n` +
                  `Cliente: ${customerName}\n` +
                  `Hora: ${new Date().toLocaleTimeString('es-MX')}\n\n` +
                  `La mesa ahora está disponible en el sistema de reservaciones.`);
            
            console.log(`✅ Mesa liberada exitosamente`);
            
            // Recargar reservaciones y estadísticas de mesas
            cargarReservaciones();
            cargarMesasOcupadas();
        } else {
            alert(`❌ Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error al liberar mesa:', error);
        alert('Error al liberar la mesa');
    }
}

// Actualizar reloj
function updateTime() {
    const now = new Date();
    
    // Actualizar hora
    const timeString = now.toLocaleTimeString('es-MX');
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = timeString;
    }

    // Actualizar fecha
    const dateString = now.toLocaleDateString('es-MX', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = dateString.charAt(0).toUpperCase() + dateString.slice(1);
    }
}

// Cerrar sesión
function logout() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        alert('Sesión cerrada correctamente\n\nHasta pronto 👋');
        window.location.href = 'login_personal.html';
    }
}

// Cargar información del empleado
function cargarInfoEmpleado() {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
        const user = JSON.parse(usuario);
        const staffNameElement = document.querySelector('.staff-name');
        if (staffNameElement) {
            staffNameElement.textContent = user.nombre_completo || user.username;
        }
    }
}

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', function() {
    cargarInfoEmpleado();
    cargarPedidos();
    cargarReservaciones().then(reservaciones => {
        // Las estadísticas de reservaciones se actualizan en mostrarReservaciones
    });
    cargarMesasOcupadas();
    updateTime();
    setInterval(updateTime, 1000);

    // Actualizar pedidos y reservaciones cada 30 segundos
    setInterval(() => {
        cargarPedidos();
        cargarReservaciones();
        cargarMesasOcupadas();
    }, 30000);
});