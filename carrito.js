// Configuración de la API
const API_URL = 'http://losmaschiludos-env.eba-nancjrev.us-east-1.elasticbeanstalk.com/api';

let cart = [];
let cartCount = 0;

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

// Cargar carrito desde localStorage
function cargarCarritoDesdeStorage() {
    const cartStorage = localStorage.getItem('cart');
    if (cartStorage) {
        cart = JSON.parse(cartStorage);
        cartCount = cart.length;
        actualizarContadorCarrito();
        mostrarProductosEnCarrito();
        actualizarResumen();
    } else {
        mostrarCarritoVacio();
    }
}

// Actualizar contador del carrito
function actualizarContadorCarrito() {
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
}

// Mostrar productos en el carrito
function mostrarProductosEnCarrito() {
    const cartItemsContainer = document.querySelector('.cart-items');
    
    if (!cartItemsContainer) return;
    
    if (cart.length === 0) {
        mostrarCarritoVacio();
        return;
    }

    // Agrupar productos por ID y sumar cantidades
    const productosAgrupados = {};
    cart.forEach(item => {
        if (productosAgrupados[item.id]) {
            productosAgrupados[item.id].cantidad += 1;
        } else {
            productosAgrupados[item.id] = {
                ...item,
                cantidad: 1,
                preferencias: item.preferencias || ''
            };
        }
    });

    cartItemsContainer.innerHTML = '';

    Object.values(productosAgrupados).forEach(producto => {
        const itemHTML = `
            <div class="cart-item" data-product-id="${producto.id}">
                <button class="btn-remove" onclick="eliminarProducto(${producto.id})">×</button>
                <div class="item-icon">🌮</div>
                <div class="item-details">
                    <div class="item-name">${producto.name}</div>
                    <div class="item-description">${producto.descripcion || 'Delicioso platillo'}</div>
                    <input 
                        type="text" 
                        class="item-preferences" 
                        placeholder="Ej: Sin cebolla, extra salsa..."
                        value="${producto.preferencias}"
                        onchange="actualizarPreferencias(${producto.id}, this.value)"
                    >
                </div>
                <div class="item-price-section">
                    <div class="item-price" data-precio-base="${producto.price}">$${producto.price * producto.cantidad} MXN</div>
                    <div class="item-quantity">
                        <button class="qty-btn" onclick="decrementarCantidad(${producto.id})">−</button>
                        <span class="qty-number">${producto.cantidad}</span>
                        <button class="qty-btn" onclick="incrementarCantidad(${producto.id})">+</button>
                    </div>
                </div>
            </div>
        `;
        cartItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
    });

    actualizarResumen();
}

// Incrementar cantidad
function incrementarCantidad(productId) {
    const producto = cart.find(item => item.id === productId);
    if (producto) {
        cart.push({...producto});
        cartCount++;
        localStorage.setItem('cart', JSON.stringify(cart));
        mostrarProductosEnCarrito();
        actualizarContadorCarrito();
    }
}

// Decrementar cantidad
function decrementarCantidad(productId) {
    const index = cart.findIndex(item => item.id === productId);
    if (index !== -1) {
        cart.splice(index, 1);
        cartCount--;
        localStorage.setItem('cart', JSON.stringify(cart));
        
        if (cart.length === 0) {
            mostrarCarritoVacio();
        } else {
            mostrarProductosEnCarrito();
        }
        actualizarContadorCarrito();
    }
}

// Eliminar producto
function eliminarProducto(productId) {
    const producto = cart.find(item => item.id === productId);
    if (producto && confirm(`¿Eliminar ${producto.name} del carrito?`)) {
        cart = cart.filter(item => item.id !== productId);
        cartCount = cart.length;
        localStorage.setItem('cart', JSON.stringify(cart));
        
        if (cart.length === 0) {
            mostrarCarritoVacio();
        } else {
            mostrarProductosEnCarrito();
        }
        actualizarContadorCarrito();
    }
}

// Actualizar preferencias
function actualizarPreferencias(productId, preferencias) {
    cart.forEach(item => {
        if (item.id === productId) {
            item.preferencias = preferencias;
        }
    });
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Actualizar resumen
function actualizarResumen() {
    // Calcular subtotal
    let subtotal = 0;
    const productosAgrupados = {};
    
    cart.forEach(item => {
        if (productosAgrupados[item.id]) {
            productosAgrupados[item.id].cantidad += 1;
        } else {
            productosAgrupados[item.id] = { ...item, cantidad: 1 };
        }
    });

    Object.values(productosAgrupados).forEach(producto => {
        subtotal += producto.price * producto.cantidad;
    });

    const iva = Math.round(subtotal * 0.16);
    const total = subtotal + iva;

    document.getElementById('subtotal').textContent = `$${subtotal} MXN`;
    document.getElementById('shipping').textContent = '$0 MXN';
    document.getElementById('tax').textContent = `$${iva} MXN`;
    document.getElementById('total').textContent = `$${total} MXN`;
}

// Mostrar carrito vacío
function mostrarCarritoVacio() {
    const cartMain = document.querySelector('.cart-main');
    if (cartMain) {
        cartMain.innerHTML = `
            <div class="cart-title">🛒 Tu Carrito</div>
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h3>Tu carrito está vacío</h3>
                <p>¡Agrega algunos platillos chiludos!</p>
                <a href="menu.html" class="btn-checkout" style="max-width: 300px; margin: 20px auto; display: block; text-decoration: none; text-align: center;">
                    Ver Menú
                </a>
            </div>
        `;
    }
}

// Realizar pedido (checkout)
async function checkout() {
    console.log('🛒 Iniciando checkout...');
    
    if (cart.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }

    // Agrupar productos y preparar para enviar al backend
    const productosAgrupados = {};
    cart.forEach(item => {
        if (productosAgrupados[item.id]) {
            productosAgrupados[item.id].cantidad += 1;
        } else {
            productosAgrupados[item.id] = {
                producto_id: item.id,
                cantidad: 1,
                precio_unitario: item.price,
                preferencias: item.preferencias || null
            };
        }
    });

    const productos = Object.values(productosAgrupados);
    
    console.log('📦 Productos agrupados:', productos);
    
    const pedidoData = {
        productos: productos,
        tipo: 'local',
        comentarios: null
    };
    
    console.log('📨 Datos a enviar:', pedidoData);

    try {
        console.log('🔐 Enviando pedido a:', `${API_URL}/pedidos`);
        
        const response = await fetchConToken(`${API_URL}/pedidos`, {
            method: 'POST',
            body: JSON.stringify(pedidoData)
        });

        console.log('📥 Respuesta recibida:', response);

        const data = await response.json();
        
        console.log('✅ Datos del pedido:', data);

        if (data.success) {
            // Calcular detalles para el mensaje
            let detallesProductos = '';
            productos.forEach(prod => {
                const productoOriginal = cart.find(item => item.id === prod.producto_id);
                detallesProductos += `• ${prod.cantidad}x ${productoOriginal.name} - $${prod.precio_unitario * prod.cantidad} MXN\n`;
                if (prod.preferencias) {
                    detallesProductos += `  📝 ${prod.preferencias}\n`;
                }
            });

            alert(`✅ PEDIDO REALIZADO EXITOSAMENTE\n\n` +
                  `Pedido #${data.data.pedido_id}\n\n` +
                  `${detallesProductos}\n` +
                  `━━━━━━━━━━━━━━━━━━━━\n` +
                  `TOTAL: $${data.data.total} MXN\n\n` +
                  `Tu pedido está siendo preparado.\n` +
                  `¡Gracias por tu preferencia! 🌶️`);

            console.log('🎉 Pedido creado exitosamente, ID:', data.data.pedido_id);

            // Limpiar carrito
            cart = [];
            cartCount = 0;
            localStorage.removeItem('cart');
            
            // Redirigir al menú o mostrar carrito vacío
            window.location.href = 'menu.html';
        } else {
            console.error('❌ Error en la respuesta:', data.message);
            alert(`❌ Error al crear el pedido:\n${data.message}`);
        }
    } catch (error) {
        console.error('💥 Error al realizar pedido:', error);
        alert('❌ Error al conectar con el servidor. Intenta nuevamente.');
    }
}

// Aplicar código promocional (placeholder)
function applyPromo() {
    const promoInput = document.querySelector('.promo-input');
    const code = promoInput.value.trim().toUpperCase();
    
    if (code === 'CHILUDO10') {
        alert('✅ Código aplicado: 10% de descuento\n\n¡Ahorraste en tu pedido chiludo!');
        promoInput.value = '';
    } else if (code) {
        alert('❌ Código inválido\n\nIntenta con otro código de descuento.');
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
            localStorage.removeItem('cart');
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
    cargarCarritoDesdeStorage();
});