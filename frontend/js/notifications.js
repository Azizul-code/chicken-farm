// ============================================
// ADMIN NOTIFICATION BELL (Home Page)
// Only shows count, click redirects to admin
// ============================================

const API_NOTIF = window.location.origin + '/api';
let notifData = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
let notifInterval = null;
let lastCheckTime = 0;

function isAdminLoggedIn() {
  return localStorage.getItem('adminToken') !== null;
}

// Show/hide bell based on admin login
function updateNotifVisibility() {
  const wrapper = document.getElementById('adminNotifWrapper');
  if (!wrapper) return;
  
  if (isAdminLoggedIn()) {
    wrapper.style.display = 'inline-block';
  } else {
    wrapper.style.display = 'none';
  }
}

// Update unread count badge
function updateNotifBadge() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  
  const unreadCount = notifData.filter(n => !n.read).length;
  
  if (unreadCount > 0) {
    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// Click on bell → go to admin panel
function openAdminFromBell() {
  window.location.href = 'admin.html';
}

// Check for new orders
async function checkNewOrdersNotif() {
  if (!isAdminLoggedIn()) return;
  
  const now = Date.now();
  if (now - lastCheckTime < 5000) return;
  lastCheckTime = now;
  
  try {
    const res = await fetch(API_NOTIF + '/orders');
    if (!res.ok) return;
    
    const orders = await res.json();
    const existingIds = notifData.map(n => n.id);
    const newOrders = orders.filter(o => !existingIds.includes(o.id));
    
    if (newOrders.length > 0) {
      newOrders.forEach(order => {
        notifData.push({
          id: order.id,
          customer: order.customer,
          total: order.total,
          items: order.items,
          createdAt: order.createdAt,
          read: false
        });
      });
      
      localStorage.setItem('adminNotifications', JSON.stringify(notifData));
      updateNotifBadge();
      
      // Show toast
      if (typeof showToast === 'function') {
        if (newOrders.length === 1) {
          showToast(`🔔 নতুন অর্ডার! #${newOrders[0].id}`);
        } else {
          showToast(`🔔 ${newOrders.length}টি নতুন অর্ডার!`);
        }
      }
      
      playNotifSound();
    }
  } catch (err) {
    console.error('Notif check error:', err);
  }
}

// Play notification sound
function playNotifSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch (err) {}
}

// Start polling
function startNotifPolling() {
  if (notifInterval) return;
  checkNewOrdersNotif();
  notifInterval = setInterval(checkNewOrdersNotif, 15000);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  updateNotifVisibility();
  updateNotifBadge();
  
  if (isAdminLoggedIn()) {
    startNotifPolling();
  }
});

// Watch storage changes
window.addEventListener('storage', function(e) {
  if (e.key === 'adminToken' || e.key === 'adminNotifications') {
    notifData = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
    updateNotifVisibility();
    updateNotifBadge();
    
    if (isAdminLoggedIn()) {
      startNotifPolling();
    }
  }
});