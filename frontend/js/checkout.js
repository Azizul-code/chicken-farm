function openCheckout() {
  if (cart.length === 0) {
    showToast('কার্ট খালি', true);
    return;
  }
  toggleCart();
  const modal = document.getElementById('checkoutModal');
  modal.classList.add('active');
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.getElementById('checkoutTotal').textContent = '৳' + total;
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('active');
}

async function placeOrder(e) {
  e.preventDefault();

  // Payment method এবং transaction info নিন
  const paymentMethodEl = document.getElementById('paymentMethod');
  const trxIdEl = document.getElementById('custTrxId');
  const senderNumberEl = document.getElementById('custSenderNumber');

  const paymentMethod = paymentMethodEl ? paymentMethodEl.value : 'cod';
  const trxId = trxIdEl ? trxIdEl.value.trim() : '';
  const senderNumber = senderNumberEl ? senderNumberEl.value.trim() : '';

  // Customer info তৈরি
  const customer = {
    name: document.getElementById('custName').value.trim(),
    phone: document.getElementById('custPhone').value.trim(),
    address: document.getElementById('custAddress').value.trim(),
    note: document.getElementById('custNote').value.trim(),
    paymentMethod: paymentMethod,
    transactionId: trxId,
    senderNumber: senderNumber
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderData = { customer: customer, items: cart, total: total };

  try {
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = '⏳ প্রসেস হচ্ছে...';

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
    showToast('অর্ডার দিতে সমস্যা হয়েছে', true);
  } finally {
    const btn = e.target.querySelector('button[type=submit]');
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🎉 অর্ডার কনফার্ম করুন';
    }
  }
}

function closeSuccess() {
  document.getElementById('successModal').classList.remove('active');
}

// Payment method অনুযায়ী info দেখান/লুকান
function togglePaymentInfo() {
  const methodEl = document.getElementById('paymentMethod');
  const infoEl = document.getElementById('paymentInfo');
  const numberEl = document.getElementById('paymentNumber');

  if (!methodEl || !infoEl) return;

  const method = methodEl.value;

  if (method === 'bkash') {
    infoEl.style.display = 'block';
    if (numberEl) numberEl.textContent = '01711-XXXXXX (bKash)';
  } else if (method === 'nagad') {
    infoEl.style.display = 'block';
    if (numberEl) numberEl.textContent = '01811-XXXXXX (Nagad)';
  } else {
    infoEl.style.display = 'none';
  }
}