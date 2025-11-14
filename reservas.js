// Configuración de la API
const API_URL = 'http://losmaschiludos-env.eba-nancjrev.us-east-1.elasticbeanstalk.com/api';

let selectedTable = null;
let mesasDisponibles = [];

// Obtener token del localStorage
const getToken = () => {
    return localStorage.getItem('token');
};

// Función para hacer peticiones autenticadas
const fetchConToken = async (url, options = {}) => {
    const token = getToken();
    
    if (!token) {
        alert('No hay sesión activa. Redirigiendo al login...');
        window.location.href = 'login.html';
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
            window.location.href = 'login.html';
            return;
        }

        return response;
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
};

// Cargar mesas desde la base de datos
async function cargarMesas() {
    try {
        // Usar ruta pública de mesas disponibles
        const response = await fetch(`${API_URL}/mesas/disponibles`);
        
        const data = await response.json();

        if (data.success) {
            mesasDisponibles = data.data;
            mostrarMesas(mesasDisponibles);
        } else {
            console.error('Error al cargar mesas:', data.message);
            alert('❌ Error al cargar las mesas. Intenta recargar la página.');
        }
    } catch (error) {
        console.error('Error al cargar mesas:', error);
        alert('❌ No se pudo conectar con el servidor.');
    }
}

// Mostrar mesas en el DOM
function mostrarMesas(mesas) {
    const tablesGrid = document.querySelector('.tables-grid');
    
    if (!tablesGrid) return;

    tablesGrid.innerHTML = '';

    mesas.forEach(mesa => {
        const isOcupada = mesa.estado === 'ocupada' || mesa.estado === 'reservada';
        const mesaCard = document.createElement('div');
        mesaCard.className = `table-card ${isOcupada ? 'occupied' : ''}`;
        mesaCard.setAttribute('data-table', mesa.id);
        mesaCard.setAttribute('data-capacity', mesa.capacidad);
        mesaCard.setAttribute('data-numero', mesa.numero_mesa);
        
        if (!isOcupada) {
            mesaCard.setAttribute('onclick', `selectTable(this)`);
        }

        const estadoClass = isOcupada ? 'status-occupied' : 'status-available';
        const estadoText = isOcupada ? 'Ocupada' : 'Disponible';

        mesaCard.innerHTML = `
            <div class="table-icon">🪑</div>
            <div class="table-number">Mesa ${mesa.numero_mesa}</div>
            <div class="table-capacity">${mesa.capacidad} personas</div>
            <span class="table-status ${estadoClass}">${estadoText}</span>
        `;

        tablesGrid.appendChild(mesaCard);
    });
}

// Seleccionar mesa
function selectTable(tableElement) {
    // Remover selección previa
    const previouslySelected = document.querySelector('.table-card.selected');
    if (previouslySelected) {
        previouslySelected.classList.remove('selected');
        const prevStatus = previouslySelected.querySelector('.table-status');
        prevStatus.textContent = 'Disponible';
        prevStatus.className = 'table-status status-available';
    }

    // Agregar nueva selección
    tableElement.classList.add('selected');
    const status = tableElement.querySelector('.table-status');
    status.textContent = 'Seleccionada';
    status.className = 'table-status status-selected';

    selectedTable = {
        id: parseInt(tableElement.getAttribute('data-table')),
        number: parseInt(tableElement.getAttribute('data-numero')),
        capacity: parseInt(tableElement.getAttribute('data-capacity'))
    };

    checkFormValidity();
}

// Verificar validez del formulario
function checkFormValidity() {
    const fullName = document.getElementById('fullName').value;
    const phone = document.getElementById('phone').value;
    const guests = document.getElementById('guests').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    const submitBtn = document.getElementById('submitBtn');
    
    if (fullName && phone && guests && date && time && selectedTable) {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
}

// Crear reservación
async function crearReservacion(event) {
    event.preventDefault();

    console.log('📝 Iniciando proceso de reservación...');

    if (!selectedTable) {
        alert('❌ Por favor selecciona una mesa');
        return;
    }

    const formData = {
        mesa_id: selectedTable.id,
        nombre_completo: document.getElementById('fullName').value,
        telefono: document.getElementById('phone').value,
        email: document.getElementById('email').value || null,
        numero_personas: parseInt(document.getElementById('guests').value),
        fecha_reservacion: document.getElementById('date').value,
        hora_reservacion: document.getElementById('time').value,
        comentarios: document.getElementById('comments').value || null
    };

    console.log('📦 Datos de la reservación:', formData);
    console.log('🔐 Enviando a:', `${API_URL}/reservaciones`);

    try {
        const response = await fetchConToken(`${API_URL}/reservaciones`, {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        console.log('📥 Respuesta recibida:', response);

        const data = await response.json();

        console.log('✅ Datos de respuesta:', data);

        if (data.success) {
            // Formatear fecha
            const dateObj = new Date(formData.fecha_reservacion + 'T00:00:00');
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const formattedDate = dateObj.toLocaleDateString('es-MX', options);

            const confirmation = `
✅ RESERVACIÓN CONFIRMADA

━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DATOS DE LA RESERVACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Nombre: ${formData.nombre_completo}
📱 Teléfono: ${formData.telefono}
📧 Email: ${formData.email || 'No proporcionado'}

🪑 Mesa: Mesa ${selectedTable.number} (${selectedTable.capacity} personas)
👥 Comensales: ${formData.numero_personas}

📅 Fecha: ${formattedDate}
🕐 Hora: ${formData.hora_reservacion}

💬 Comentarios: ${formData.comentarios || 'Ninguno'}

━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ IMPORTANTE
━━━━━━━━━━━━━━━━━━━━━━━━━

• Tolerancia de llegada: 30 minutos
• Después de ese tiempo, la mesa se pondrá disponible
• La reservación es GRATUITA
• No se requiere pago anticipado

¡Te esperamos en Los Más Chiludos! 🌶️
            `;

            alert(confirmation);

            console.log('🎉 Reservación creada exitosamente!');

            // Reset form
            document.getElementById('reservationForm').reset();
            if (document.querySelector('.table-card.selected')) {
                const selectedCard = document.querySelector('.table-card.selected');
                selectedCard.classList.remove('selected');
                const status = selectedCard.querySelector('.table-status');
                status.textContent = 'Disponible';
                status.className = 'table-status status-available';
            }
            
            selectedTable = null;
            
            // Establecer fecha y hora por defecto
            const dateInput = document.getElementById('date');
            const timeInput = document.getElementById('time');
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
            timeInput.value = '13:00';
            
            checkFormValidity();
            
            // Recargar mesas para actualizar estados
            cargarMesas();

        } else {
            console.error('❌ Error en la respuesta:', data.message);
            alert(`❌ Error al crear la reservación:\n${data.message}`);
        }
    } catch (error) {
        console.error('💥 Error al crear reservación:', error);
        alert('❌ Error al conectar con el servidor. Intenta nuevamente.');
    }
}

// Manejo de sesión
function checkSession() {
    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');
    const sessionBtn = document.getElementById('sessionBtn');
    
    if (sessionBtn) {
        if (token && usuario) {
            const user = JSON.parse(usuario);
            sessionBtn.textContent = user.username;
            sessionBtn.classList.add('logged-in');
            sessionBtn.title = 'Cerrar sesión';
        } else {
            sessionBtn.textContent = 'Iniciar Sesión';
            sessionBtn.classList.remove('logged-in');
            sessionBtn.title = 'Iniciar sesión';
        }
    }
}

function handleSession() {
    const token = localStorage.getItem('token');
    
    if (token) {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            alert('Sesión cerrada exitosamente');
            window.location.href = 'inicio.html';
        }
    } else {
        window.location.href = 'login.html';
    }
}

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    cargarMesas();

    // Configurar fecha mínima (hoy)
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    dateInput.value = today;

    // Configurar hora por defecto
    const timeInput = document.getElementById('time');
    timeInput.value = '13:00';

    // Event listeners para validación del formulario
    document.getElementById('fullName').addEventListener('input', checkFormValidity);
    document.getElementById('phone').addEventListener('input', checkFormValidity);
    document.getElementById('guests').addEventListener('change', checkFormValidity);
    document.getElementById('date').addEventListener('change', checkFormValidity);
    document.getElementById('time').addEventListener('change', checkFormValidity);

    // Event listener para el submit del formulario
    const reservationForm = document.getElementById('reservationForm');
    if (reservationForm) {
        reservationForm.addEventListener('submit', crearReservacion);
    }
});