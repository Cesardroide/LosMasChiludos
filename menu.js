// Configuración de la API
const API_URL = 'http://losmaschiludos-env.eba-nancjrev.us-east-1.elasticbeanstalk.com/api';

let cart = [];
let cartCount = 0;

// Cargar productos desde la base de datos
async function cargarProductos() {
    try {
        const response = await fetch(`${API_URL}/productos`);
        const data = await response.json();

        if (data.success) {
            mostrarProductos(data.data);
        } else {
            console.error('Error al cargar productos:', data.message);
            alert('❌ Error al cargar el menú. Intenta recargar la página.');
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        alert('❌ No se pudo conectar con el servidor. Asegúrate de que el backend esté corriendo.');
    }
}

// Mostrar productos en el DOM
function mostrarProductos(productos) {
    console.log('Productos recibidos:', productos); // Debug
    
    // Agrupar productos por categoría (dinámicamente)
    const categorias = {};

    productos.forEach(producto => {
        if (producto.disponible) { // Solo mostrar productos disponibles
            // Si la categoría no existe, créala
            if (!categorias[producto.categoria]) {
                categorias[producto.categoria] = [];
            }
            categorias[producto.categoria].push(producto);
        }
    });

    // Mapeo de categorías con iconos
    const categoriasInfo = {
        'plato_fuerte': { titulo: '🌮 Tacos y Tortas', icono: '🌮' },
        'entrada': { titulo: '🍴 Antojitos', icono: '🍴' },
        'bebida': { titulo: '🥤 Bebidas', icono: '🥤' },
        'postre': { titulo: '🍰 Postres', icono: '🍰' },
        'otros': { titulo: '🍽️ Otros', icono: '🍽️' }
    };

    // Obtener el contenedor del menú
    const menuContainer = document.querySelector('.menu-container');
    
    // Limpiar el contenido actual
    menuContainer.innerHTML = '';

    // Crear secciones para cada categoría encontrada
    Object.keys(categorias).forEach(categoria => {
        const productosCat = categorias[categoria];
        
        if (productosCat.length > 0) {
            // Obtener info de la categoría o usar valores por defecto
            const info = categoriasInfo[categoria] || { 
                titulo: `${categoria.charAt(0).toUpperCase() + categoria.slice(1).replace('_', ' ')}`, 
                icono: '🍽️' 
            };
            
            // Crear sección
            const seccion = document.createElement('div');
            seccion.className = 'menu-section';
            
            // Título de la sección
            const titulo = document.createElement('h2');
            titulo.className = 'section-title';
            titulo.textContent = info.titulo;
            seccion.appendChild(titulo);
            
            // Grid de productos
            const grid = document.createElement('div');
            grid.className = 'menu-grid';
            
            // Crear cards para cada producto
            productosCat.forEach(producto => {
                const card = crearCardProducto(producto);
                grid.appendChild(card);
            });
            
            seccion.appendChild(grid);
            menuContainer.appendChild(seccion);
        }
    });
}

// Crear card de producto
function crearCardProducto(producto) {
    const card = document.createElement('div');
    card.className = 'menu-item';
    
    // Badge de popular (opcional - puedes agregar un campo "popular" en la BD)
    // if (producto.popular) {
    //     const badge = document.createElement('span');
    //     badge.className = 'popular-badge';
    //     badge.textContent = '⭐ Popular';
    //     card.appendChild(badge);
    // }
    
    // Header (nombre y precio)
    const header = document.createElement('div');
    header.className = 'item-header';
    
    const nombre = document.createElement('h3');
    nombre.className = 'item-name';
    nombre.textContent = producto.nombre;
    
    const precio = document.createElement('span');
    precio.className = 'item-price';
    precio.textContent = `$${producto.precio} MXN`;
    
    header.appendChild(nombre);
    header.appendChild(precio);
    card.appendChild(header);
    
    // Descripción
    if (producto.descripcion) {
        const descripcion = document.createElement('p');
        descripcion.className = 'item-description';
        descripcion.textContent = producto.descripcion;
        card.appendChild(descripcion);
    }
    
    // Nivel de picante
    if (producto.nivel_picante && producto.nivel_picante !== 'sin_picante') {
        const spicyDiv = document.createElement('div');
        spicyDiv.className = 'spicy-level';
        
        const nivelPicante = {
            'poco': 1,
            'medio': 2,
            'muy_picante': 3,
            'extremo': 4
        };
        
        const nivel = nivelPicante[producto.nivel_picante] || 0;
        
        for (let i = 1; i <= 3; i++) {
            const chile = document.createElement('span');
            chile.className = i <= nivel ? 'chile-indicator' : 'chile-indicator inactive';
            chile.textContent = '🌶️';
            spicyDiv.appendChild(chile);
        }
        
        card.appendChild(spicyDiv);
    }
    
    // Botón de agregar al carrito
    const boton = document.createElement('button');
    boton.className = 'btn-add-cart';
    boton.textContent = '🛒 Agregar al Carrito';
    boton.onclick = () => addToCart(producto.nombre, producto.precio, producto.id);
    card.appendChild(boton);
    
    return card;
}

// Agregar producto al carrito
function addToCart(itemName, itemPrice, itemId) {
    cart.push({ 
        id: itemId,
        name: itemName, 
        price: itemPrice 
    });
    cartCount++;
    document.getElementById('cartCount').textContent = cartCount;
    
    // Guardar carrito en localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Animación del botón del carrito
    const cartButton = document.querySelector('.cart-button');
    cartButton.style.transform = 'scale(1.2)';
    setTimeout(() => {
        cartButton.style.transform = 'scale(1)';
    }, 200);
    
    // Mostrar mensaje
    alert('✅ ' + itemName + ' agregado al carrito\n\nTotal de productos: ' + cartCount);
}

// Mostrar carrito
function toggleCart() {
    if (cart.length === 0) {
        alert('🛒 Tu carrito está vacío\n\n¡Agrega algunos platillos chiludos!');
        return;
    }
    
    let total = 0;
    let cartDetails = '🛒 CARRITO DE COMPRAS\n\n';
    
    cart.forEach((item, index) => {
        cartDetails += `${index + 1}. ${item.name} - $${item.price} MXN\n`;
        total += item.price;
    });
    
    cartDetails += `\n━━━━━━━━━━━━━━━━━━━━\nTOTAL: $${total} MXN\n\nProductos: ${cartCount}`;
    
    alert(cartDetails);
}

// Manejo de sesión
function checkSession() {
    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');
    const sessionBtn = document.getElementById('sessionBtn');
    
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

function handleSession() {
    const token = localStorage.getItem('token');
    
    if (token) {
        // Cerrar sesión
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            localStorage.removeItem('cart'); // Limpiar carrito al cerrar sesión
            alert('Sesión cerrada exitosamente');
            window.location.href = 'inicio.html';
        }
    } else {
        // Ir a login
        window.location.href = 'login.html';
    }
}

// Cargar carrito desde localStorage
function cargarCarritoDesdeStorage() {
    const cartStorage = localStorage.getItem('cart');
    if (cartStorage) {
        cart = JSON.parse(cartStorage);
        cartCount = cart.length;
        document.getElementById('cartCount').textContent = cartCount;
    }
}

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    cargarCarritoDesdeStorage();
    cargarProductos();
});