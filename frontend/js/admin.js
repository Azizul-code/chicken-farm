const API = window.location.origin + '/api';
let allOrders = [];
let allProducts = [];

window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    showDashboard();
  }
});

async function login(e) {
  e.preventDefault();
  const username = document.getElementById('loginUser').value;
  const password = document.getElementById('loginPass').value;

  try {
    const res = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: password })
    });

    if (!res.ok) throw new Error('Invalid');

    const data = await res.json();
    localStorage.setItem('adminToken', data.token);
    showDashboard();
    showToast('✅ লগইন সফল');
  } catch (err) {
    showToast('❌ ভুল ইউজারনেম বা পাসওয়ার্ড', true);
  }
}

function logout() {
  localStorage.removeItem('adminToken');
  location.reload();
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  loadStats();
  loadOrders();
  loadProducts();
}

function switchTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
}

async function loadStats() {
  const ordersRes = await fetch(API + '/orders');
  const productsRes = await fetch(API + '/products');
  const orders = await ordersRes.json();
  const products = await productsRes.json();

  document.getElementById('statOrders').textContent = orders.length;
  document.getElementById('statRevenue').textContent = '৳' +
    orders.reduce((sum, o) => sum + (o.total || 0), 0);
  document.getElementById('statProducts').textContent = products.length;
  document.getElementById('statPending').textContent =
    orders.filter(o => o.status === 'pending').length;
}

async function loadOrders() {
  const res = await fetch(API + '/orders');
  allOrders = await res.json();
  renderOrders();
}

function renderOrders() {
  const el = document.getElementById('ordersTable');
  if (allOrders.length === 0) {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:#a0aec0;">এখনো কোনো অর্ডার নেই</div>';
    return;
  }

  let html = '<table><thead><tr>' +
    '<th>অর্ডার ID</th><th>গ্রাহক</th><th>মোবাইল</th>' +
    '<th>মোট</th><th>স্ট্যাটাস</th><th>তারিখ</th><th>পরিবর্তন</th>' +
    '</tr></thead><tbody>';

  allOrders.forEach(o => {
    const date = new Date(o.createdAt).toLocaleDateString('bn-BD');
    html += '<tr>' +
      '<td><strong>' + o.id + '</strong></td>' +
      '<td>' + o.customer.name + '</td>' +
      '<td>' + o.customer.phone + '</td>' +
      '<td><strong>৳' + o.total + '</strong></td>' +
      '<td><span class="badge ' + o.status + '">' + o.status + '</span></td>' +
      '<td>' + date + '</td>' +
      '<td><select class="status-select" onchange="updateOrderStatus(\'' + o.id + '\', this.value)">' +
      '<option value="pending"' + (o.status === 'pending' ? ' selected' : '') + '>Pending</option>' +
      '<option value="confirmed"' + (o.status === 'confirmed' ? ' selected' : '') + '>Confirmed</option>' +
      '<option value="delivered"' + (o.status === 'delivered' ? ' selected' : '') + '>Delivered</option>' +
      '<option value="cancelled"' + (o.status === 'cancelled' ? ' selected' : '') + '>Cancelled</option>' +
      '</select></td></tr>';
  });

  html += '</tbody></table>';
  el.innerHTML = html;
}

async function updateOrderStatus(id, status) {
  try {
    await fetch(API + '/orders/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status })
    });
    showToast('✅ স্ট্যাটাস আপডেট হয়েছে');
    loadOrders();
    loadStats();
  } catch (err) {
    showToast('❌ আপডেট ব্যর্থ', true);
  }
}

async function loadProducts() {
  const res = await fetch(API + '/products');
  allProducts = await res.json();
  renderProductsTable();
}

function renderProductsTable() {
  const el = document.getElementById('productsTable');
  let html = '<table><thead><tr>' +
    '<th>ছবি</th><th>নাম</th><th>ক্যাটাগরি</th>' +
    '<th>দাম</th><th>স্টক</th><th>অ্যাকশন</th>' +
    '</tr></thead><tbody>';

  allProducts.forEach(p => {
    html += '<tr>' +
      '<td><img src="' + p.image + '" style="width:50px;height:50px;object-fit:cover;border-radius:8px;" onerror="this.src=\'https://via.placeholder.com/50\'"></td>' +
      '<td><strong>' + p.name + '</strong></td>' +
      '<td>' + p.category + '</td>' +
      '<td>৳' + p.price + ' / ' + p.unit + '</td>' +
      '<td>' + p.stock + '</td>' +
      '<td>' +
      '<button class="action-btn btn-edit" onclick="editProduct(\'' + p.id + '\')">✏️ Edit</button>' +
      '<button class="action-btn btn-delete" onclick="deleteProduct(\'' + p.id + '\')">🗑️ Delete</button>' +
      '</td></tr>';
  });

  html += '</tbody></table>';
  el.innerHTML = html;
}

function openProductForm(id) {
  const modal = document.getElementById('productModal');
  modal.classList.add('active');

  if (id) {
    const p = allProducts.find(x => x.id === id);
    document.getElementById('productFormTitle').textContent = 'প্রোডাক্ট এডিট';
    document.getElementById('productId').value = p.id;
    document.getElementById('pName').value = p.name;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pUnit').value = p.unit;
    document.getElementById('pStock').value = p.stock;
    document.getElementById('pCategory').value = p.category;
    document.getElementById('pImage').value = p.image;
    document.getElementById('pDesc').value = p.description;
  } else {
    document.getElementById('productFormTitle').textContent = 'নতুন প্রোডাক্ট';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
  }
}

function closeProductForm() {
  document.getElementById('productModal').classList.remove('active');
}

function editProduct(id) { openProductForm(id); }

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;

  const data = {
    name: document.getElementById('pName').value,
    price: Number(document.getElementById('pPrice').value),
    unit: document.getElementById('pUnit').value,
    stock: Number(document.getElementById('pStock').value),
    category: document.getElementById('pCategory').value,
    image: document.getElementById('pImage').value || 'https://via.placeholder.com/300',
    description: document.getElementById('pDesc').value
  };

  try {
    const url = id ? (API + '/products/' + id) : (API + '/products');
    const method = id ? 'PUT' : 'POST';

    await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    showToast(id ? '✅ আপডেট হয়েছে' : '✅ নতুন প্রোডাক্ট যোগ হয়েছে');
    closeProductForm();
    loadProducts();
    loadStats();
  } catch (err) {
    showToast('❌ সেভ ব্যর্থ', true);
  }
}

async function deleteProduct(id) {
  if (!confirm('এই প্রোডাক্ট ডিলিট করতে চান?')) return;
  try {
    await fetch(API + '/products/' + id, { method: 'DELETE' });
    showToast('🗑️ ডিলিট হয়েছে');
    loadProducts();
    loadStats();
  } catch (err) {
    showToast('❌ ডিলিট ব্যর্থ', true);
  }
}

function showToast(msg, isError) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(function() { toast.className = 'toast'; }, 2500);
}