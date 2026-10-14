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

  // ============ VALIDATION START ============
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const note = document.getElementById('custNote').value.trim();

  const paymentMethodEl = document.getElementById('paymentMethod');
  const paymentMethod = paymentMethodEl ? paymentMethodEl.value : 'cod';

  // ১. নাম চেক
  if (!name || name.length < 3) {
    showToast('❌ সঠিক নাম লিখুন (কমপক্ষে ৩ অক্ষর)', true);
    document.getElementById('custName').focus();
    return false;
  }

  // ২. মোবাইল নাম্বার চেক
  const phoneRegex = /^01[3-9]\d{8}$/;
  if (!phoneRegex.test(phone)) {
    showToast('❌ সঠিক মোবাইল নাম্বার দিন (যেমন: 01712345678)', true);
    document.getElementById('custPhone').focus();
    return false;
  }

  // ৩. ঠিকানা চেক
  if (!address || address.length < 5) {
    showToast('❌ সম্পূর্ণ ঠিকানা লিখুন', true);
    document.getElementById('custAddress').focus();
    return false;
  }

  // ৪. Payment method চেক
  if (!paymentMethod || paymentMethod === '') {
    showToast('❌ পেমেন্ট পদ্ধতি সিলেক্ট করুন', true);
    if (paymentMethodEl) paymentMethodEl.focus();
    return false;
  }

  let trxId = '';
  let senderNumber = '';

  // ৫. bKash/Nagad হলে TrxID ও Sender Number বাধ্যতামূলক
  if (paymentMethod === 'bkash' || paymentMethod === 'nagad') {
    const trxIdEl = document.getElementById('custTrxId');
    const senderNumberEl = document.getElementById('custSenderNumber');

    trxId = trxIdEl ? trxIdEl.value.trim() : '';
    senderNumber = senderNumberEl ? senderNumberEl.value.trim() : '';

    if (!trxId) {
      showToast('❌ ট্রানজেকশন আইডি (TrxID) লিখুন', true);
      if (trxIdEl) trxIdEl.focus();
      return false;
    }

    if (trxId.length < 6) {
      showToast('❌ সঠিক TrxID লিখুন (কমপক্ষে ৬ অক্ষর)', true);
      if (trxIdEl) trxIdEl.focus();
      return false;
    }

    if (!senderNumber) {
      showToast('❌ যে নম্বর থেকে টাকা পাঠিয়েছেন সেটি লিখুন', true);
      if (senderNumberEl) senderNumberEl.focus();
      return false;
    }

    if (!phoneRegex.test(senderNumber)) {
      showToast('❌ সঠিক sender মোবাইল নাম্বার দিন', true);
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