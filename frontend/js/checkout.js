function openCheckout() {
  if (cart.length === 0) { showToast('à¦•à¦¾à¦°à§à¦Ÿ à¦–à¦¾à¦²à¦¿', true); return; }
  toggleCart();
  const modal = document.getElementById('checkoutModal');
  modal.classList.add('active');
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.getElementById('checkoutTotal').textContent = 'à§³' + total;
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('active');
}

async function placeOrder(e) {
  e.preventDefault();
  const customer = {
    name: document.getElementById('custName').value.trim(),
    phone: document.getElementById('custPhone').value.trim(),
    address: document.getElementById('custAddress').value.trim(),
    note: document.getElementById('custNote').value.trim()
  };
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderData = { customer: customer, items: cart, total: total };

  try {
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'â³ à¦ªà§à¦°à¦¸à§‡à¦¸ à¦¹à¦šà§à¦›à§‡...';

    const res = await fetch(API + '/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) throw new Error('Order failed');
    const order = await res.json();

    cart = [];
    saveCart();
    closeCheckout();
    e.target.reset();

    document.getElementById('orderIdDisplay').textContent = order.id;
    document.getElementById('successModal').classList.add('active');
    loadProducts();
  } catch (err) {
    console.error(err);
    showToast('à¦…à¦°à§à¦¡à¦¾à¦° à¦¦à¦¿à¦¤à§‡ à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡', true);
  } finally {
    const btn = e.target.querySelector('button[type=submit]');
    if (btn) { btn.disabled = false; btn.textContent = 'ðŸŽ‰ à¦…à¦°à§à¦¡à¦¾à¦° à¦•à¦¨à¦«à¦¾à¦°à§à¦® à¦•à¦°à§à¦¨'; }
  }
}

function closeSuccess() {
  document.getElementById('successModal').classList.remove('active');
}