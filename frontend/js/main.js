const API = window.location.origin + '/api';
let products = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentCategory = 'all';
let searchTerm = '';

async function loadProducts() {
    try {
        const res = await fetch(API + '/products');
        products = await res.json();
        renderProducts();
    } catch (err) {
        console.error('Failed to load products:', err);
        showToast('প্রোডাক্ট লোড করতে সমস্যা', true);
    }
}

function renderProducts() {
    const grid = document.getElementById('productGrid');
    let filtered = products;
    if (currentCategory !== 'all') filtered = filtered.filter(p => p.category === currentCategory);
    if (searchTerm) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#a0aec0;">কোনো প্রোডাক্ট পাওয়া যায়নি</div>';
        return;
    }

    grid.innerHTML = filtered.map(p =>
        '<div class="product-card">' +
        '<img src="' + p.image + '" alt="' + p.name + '" class="product-image" onerror="this.src=\'https://via.placeholder.com/300x200?text=Product\'">' +
        '<div class="product-info">' +
        '<span class="product-category">' + p.category + '</span>' +
        '<h3 class="product-name">' + p.name + '</h3>' +
        '<p class="product-desc">' + p.description + '</p>' +
        '<div class="product-price">৳' + p.price + ' <span>/ ' + p.unit + '</span></div>' +
        '<div class="product-stock ' + (p.stock <= 0 ? 'out' : '') + '">' +
        (p.stock > 0 ? '✓ স্টকে আছে (' + p.stock + ')' : '✗ স্টক শেষ') +
        '</div>' +
        '<button class="add-btn" ' + (p.stock <= 0 ? 'disabled' : '') + ' onclick="addToCart(\'' + p.id + '\')">' +
        (p.stock > 0 ? '🛒 কার্টে যোগ করুন' : 'স্টক নেই') +
        '</button></div></div>'
    ).join('');
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const existing = cart.find(item => item.id === id);
    if (existing) {
        if (existing.quantity >= product.stock) {
            showToast('স্টকে পর্যাপ্ত নেই', true);
            return;
        }
        existing.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            unit: product.unit,
            image: product.image,
            quantity: 1
        });
    }
    saveCart();
    showToast(product.name + ' কার্টে যোগ হয়েছে ✓');
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
    const itemsEl = document.getElementById('cartItems');
    const footerEl = document.getElementById('cartFooter');

    if (cart.length === 0) {
        itemsEl.innerHTML = '<div class="empty-cart"><div class="empty-cart-icon">🛒</div><p>আপনার কার্ট খালি</p></div>';
        footerEl.style.display = 'none';
        return;
    }

    footerEl.style.display = 'block';
    itemsEl.innerHTML = cart.map(item =>
        '<div class="cart-item">' +
        '<img src="' + item.image + '" onerror="this.src=\'https://via.placeholder.com/60\'">' +
        '<div class="cart-item-info">' +
        '<div class="cart-item-name">' + item.name + '</div>' +
        '<div class="cart-item-price">৳' + item.price + ' / ' + item.unit + '</div>' +
        '<div class="qty-controls">' +
        '<button class="qty-btn" onclick="changeQty(\'' + item.id + '\', -1)">−</button>' +
        '<span>' + item.quantity + '</span>' +
        '<button class="qty-btn" onclick="changeQty(\'' + item.id + '\', 1)">+</button>' +
        '<button class="remove-item" onclick="removeFromCart(\'' + item.id + '\')">🗑️</button>' +
        '</div></div></div>'
    ).join('');

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    document.getElementById('cartTotal').textContent = '৳' + total;
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    const product = products.find(p => p.id === id);
    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(id);
        return;
    }
    if (product && item.quantity > product.stock) {
        item.quantity = product.stock;
        showToast('স্টকে পর্যাপ্ত নেই', true);
    }
    saveCart();
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
}

function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
}

function showToast(msg, isError) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast show' + (isError ? ' error' : '');
    setTimeout(function () {
        toast.className = 'toast';
    }, 2500);
}

function filterCategory(cat, btn) {
    currentCategory = cat;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts();
}

function handleSearch(e) {
    searchTerm = e.target.value;
    renderProducts();
}

document.addEventListener('DOMContentLoaded', function () {
    loadProducts();
    updateCartUI();
    document.getElementById('overlay').addEventListener('click', toggleCart);
    document.getElementById('closeCart').addEventListener('click', toggleCart);
    document.getElementById('cartBtn').addEventListener('click', toggleCart);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
});