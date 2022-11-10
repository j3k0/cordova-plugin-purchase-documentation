let appState = 'BASKET';
let appMessage = '';

function refreshUI() {
  const {store} = CdvPurchase;
  const el = document.getElementById('app');
  if (appState === 'BASKET') {
    el.innerHTML = `
      <p>${appMessage}</p>
      <p>Amount to pay for 1x Real Good: $9.99</p>
      <div><button onclick="pay()">Proceed to Payment</button></div>
    `;
  }
  else if (appState === 'PAYMENT_INITIATED') {
    el.innerHTML = `<p>Select your payment method...</p>`;
  }
  else if (appState === 'PAYMENT_APPROVED') {
    el.innerHTML = `<p>Verifying your payment...</p>`;
  }
  else if (appState === 'PAYMENT_FINISHED') {
    el.innerHTML = `<p>Payment successful!</p>`;
  }
}