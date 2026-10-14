function openCheckout() {
  if (cart.length === 0) {
    showToast('Cart is empty', true);
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

  // ============ VALIDATION START ============
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const note = document.getElementById('custNote').value.trim();

  const paymentMethodEl = document.getElementById('paymentMethod');
  const paymentMethod = paymentMethodEl ? paymentMethodEl.value : 'cod';

  // 1. Name check
  if (!name || name.length < 3) {
    showToast('❌ Please enter a valid name (at least 3 characters)', true);
    document.getElementById('custName').focus();
    return false;
  }

  // 2. Mobile number check
  const phoneRegex = /^01[3-9]\d{8}$/;
  if (!phoneRegex.test(phone)) {
    showToast('❌ Please enter a valid mobile number (e.g., 01712345678)', true);
    document.getElementById('custPhone').focus();
    return false;
  }

  // 3. Address check
  if (!address || address.length < 5) {
    showToast('❌ Please enter your full address', true);
    document.getElementById('custAddress').focus();
    return false;
  }

  // 4. Payment method check
  if (!paymentMethod || paymentMethod === '') {
    showToast('❌ Please select a payment method', true);
    if (paymentMethodEl) paymentMethodEl.focus();
    return false;
  }

  let trxId = '';
  let senderNumber = '';

  // 5. If bKash/Nagad, TrxID and Sender Number are required
  if (paymentMethod === 'bkash' || paymentMethod === 'nagad') {
    const trxIdEl = document.getElementById('custTrxId');
    const senderNumberEl = document.getElementById('custSenderNumber');

    trxId = trxIdEl ? trxIdEl.value.trim() : '';
    senderNumber = senderNumberEl ? senderNumberEl.value.trim() : '';

    if (!trxId) {
      showToast('❌ Please enter the Transaction ID (TrxID)', true);
      if (trxIdEl) trxIdEl.focus();
      return false;
    }

    if (trxId.length < 6) {
      showToast('❌ Please enter a valid TrxID (at least 6 characters)', true);
      if (trxIdEl) trxIdEl.focus();
      return false;
    }

    if (!senderNumber) {
      showToast('❌ Please enter the number you sent money from', true);
      if (senderNumberEl) senderNumberEl.focus();
      return false;
    }

    if (!phoneRegex.test(senderNumber)) {
      showToast('❌ Please enter a valid sender mobile number', true);
      if (senderNumberEl) senderNumberEl.focus();
      return false;
    }
  }
  // ============ VALIDATION END ============

  const customer = {
    name: name,
    phone: phone,
    address: address,
    note: note,
    paymentMethod: paymentMethod,
    transactionId: trxId,
    senderNumber: senderNumber
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderData = { customer: customer, items: cart, total: total };

  try {
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = '⏳ Processing...';

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
    showToast('Failed to place order', true);
  } finally {
    const btn = e.target.querySelector('button[type=submit]');
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🎉 Confirm Order';
    }
  }
  return false;
}

function closeSuccess() {
  document.getElementById('successModal').classList.remove('active');
}

function togglePaymentInfo() {
  const methodEl = document.getElementById('paymentMethod');
  const infoEl = document.getElementById('paymentInfo');
  const numberEl = document.getElementById('paymentNumber');

  if (!methodEl || !infoEl) return;

  const method = methodEl.value;

  if (method === 'bkash') {
    infoEl.style.display = 'block';
    if (numberEl) numberEl.textContent = '01712-345678 (bKash)';
  } else if (method === 'nagad') {
    infoEl.style.display = 'block';
    if (numberEl) numberEl.textContent = '01812-345678 (Nagad)';
  } else {
    infoEl.style.display = 'none';
  }
}