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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
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
        '<th>পেমেন্ট</th><th>TrxID</th>' +
        '<th>মোট</th><th>স্ট্যাটাস</th><th>তারিখ</th><th>পরিবর্তন</th>' +
        '</tr></thead><tbody>';

    allOrders.forEach(o => {
        const date = new Date(o.createdAt).toLocaleDateString('bn-BD');
        html += '<tr>' +
            '<td><strong>' + o.id + '</strong></td>' +
            '<td>' + o.customer.name + '</td>' +
            '<td>' + o.customer.phone + '</td>' +
            '<td>' + (o.customer.paymentMethod || 'cod') + '</td>' +
            '<td>' + (o.customer.transactionId || '-') + '</td>' +
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: status
            })
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

function editProduct(id) {
    openProductForm(id);
}

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
            headers: {
                'Content-Type': 'application/json'
            },
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
        await fetch(API + '/products/' + id, {
            method: 'DELETE'
        });
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
    setTimeout(function () {
        toast.className = 'toast';
    }, 2500);
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================

let notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
let notifCheckInterval = null;

// Calculate new notifications
function updateNotificationBadge() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  if (unreadCount > 0) {
    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// Render notification list
function renderNotifications() {
  const list = document.getElementById('notifList');
  if (!list) return;
  
  if (notifications.length === 0) {
    list.innerHTML = '<div class="notif-empty">কোনো নতুন অর্ডার নেই</div>';
    return;
  }
  
  // Sort by date (newest first)
  const sorted = [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  list.innerHTML = sorted.slice(0, 20).map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="openOrder('${n.id}')">
      <div class="notif-item-id">অর্ডার #${n.id}</div>
      <div class="notif-item-customer">
        👤 ${n.customer.name}
        <span class="notif-item-amount">৳${n.total}</span>
      </div>
      <div class="notif-item-details">
        📞 ${n.customer.phone} | ${new Date(n.createdAt).toLocaleString('bn-BD')}
      </div>
    </div>
  `).join('');
}

// Toggle notification dropdown
function toggleNotifications() {
  const dropdown = document.getElementById('notifDropdown');
  if (!dropdown) return;
  
  dropdown.classList.toggle('open');
  
  // Mark all as read when opening
  if (dropdown.classList.contains('open')) {
    // Don't auto-mark; only on explicit click
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
  const wrapper = document.querySelector('.notif-wrapper');
  const dropdown = document.getElementById('notifDropdown');
  if (wrapper && dropdown && !wrapper.contains(e.target)) {
    dropdown.classList.remove('open');
  }
});

// Open specific order
function openOrder(orderId) {
  // Mark as read
  const notif = notifications.find(n => n.id === orderId);
  if (notif) {
    notif.read = true;
    saveNotifications();
  }
  
  // Close dropdown
  const dropdown = document.getElementById('notifDropdown');
  if (dropdown) dropdown.classList.remove('open');
  
  // Switch to orders tab
  const ordersTabBtn = document.querySelectorAll('.tab-btn')[1];
  if (ordersTabBtn) {
    switchTab('orders', ordersTabBtn);
  }
  
  // Highlight the order
  setTimeout(() => {
    const rows = document.querySelectorAll('#ordersTable tr');
    rows.forEach(row => {
      if (row.innerHTML.includes(orderId)) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.style.background = '#fef5e7';
        setTimeout(() => row.style.background = '', 3000);
      }
    });
  }, 500);
}

// Clear all notifications
function clearNotifications() {
  notifications.forEach(n => n.read = true);
  saveNotifications();
  showToast('✅ সব notification পঠিত হিসেবে চিহ্নিত');
}

// Save notifications
function saveNotifications() {
  localStorage.setItem('adminNotifications', JSON.stringify(notifications));
  updateNotificationBadge();
  renderNotifications();
}

// Check for new orders
async function checkNewOrders() {
  try {
    const res = await fetch(API + '/orders');
    if (!res.ok) return;
    
    const orders = await res.json();
    
    // Find new orders not in notifications
    const existingIds = notifications.map(n => n.id);
    const newOrders = orders.filter(o => !existingIds.includes(o.id));
    
    if (newOrders.length > 0) {
      newOrders.forEach(order => {
        notifications.push({
          id: order.id,
          customer: order.customer,
          total: order.total,
          items: order.items,
          createdAt: order.createdAt,
          read: false
        });
      });
      
      saveNotifications();
      
      // Show toast
      if (newOrders.length === 1) {
        showToast(`🔔 নতুন অর্ডার! #${newOrders[0].id}`);
      } else {
        showToast(`🔔 ${newOrders.length}টি নতুন অর্ডার!`);
      }
      
      // Play sound (optional)
      playNotificationSound();
    }
  } catch (err) {
    console.error('Check orders error:', err);
  }
}

// Play notification sound
function playNotificationSound() {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQBvT18=');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch (err) {
    // Ignore
  }
}

// Start notification polling
function startNotificationPolling() {
  if (notifCheckInterval) return;
  
  // Check every 10 seconds
  notifCheckInterval = setInterval(checkNewOrders, 10000);
  
  // Initial check
  checkNewOrders();
}

// Stop polling
function stopNotificationPolling() {
  if (notifCheckInterval) {
    clearInterval(notifCheckInterval);
    notifCheckInterval = null;
  }
}

// Initialize notifications when dashboard loads
const originalShowDashboard = window.showDashboard;
window.showDashboard = function() {
  if (originalShowDashboard) originalShowDashboard.apply(this, arguments);
  updateNotificationBadge();
  renderNotifications();
  startNotificationPolling();
};

// Update logout to stop polling
const originalLogout = window.logout;
window.logout = function() {
  stopNotificationPolling();
  if (originalLogout) originalLogout.apply(this, arguments);
};