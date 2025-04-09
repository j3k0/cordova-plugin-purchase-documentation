// Global state variables (consider a more robust state management approach for larger apps)
let appState = 'LOADING'; // Initial state: LOADING, BASKET, IN_PROGRESS, PAYMENT_INITIATED, PAYMENT_APPROVED, PAYMENT_FINISHED
let appMessage = 'Initializing Payment...';

// Function to update the application's UI based on the current state
function refreshUI() {
  const appEl = document.getElementById('app'); // Main container element
  const messagesEl = document.getElementById('messages'); // Element for status messages
  const paymentSectionEl = document.getElementById('payment-section'); // Payment specific section
  const payButtonEl = document.getElementById('pay-button'); // The pay button

  if (!appEl || !messagesEl || !paymentSectionEl || !payButtonEl) {
    console.error('Required UI elements not found in index.html for refreshUI!');
    // Attempt to create elements if missing (basic fallback for snippets)
    if (!messagesEl && appEl) appEl.insertAdjacentHTML('afterbegin', '<div id="messages"></div>');
    if (!paymentSectionEl && appEl) appEl.insertAdjacentHTML('beforeend', '<div id="payment-section"><button id="pay-button">Pay</button></div>');
    // Re-query after potential creation
    messagesEl = document.getElementById('messages');
    paymentSectionEl = document.getElementById('payment-section');
    payButtonEl = document.getElementById('pay-button');
    if (!messagesEl || !paymentSectionEl || !payButtonEl) return; // Still missing, give up
  }


  console.log(`Refreshing UI - State: ${appState}, Message: ${appMessage}`);

  // Update status message display
  messagesEl.textContent = appMessage;
  messagesEl.style.color = appState.startsWith('Error') || appState.includes('Failed') ? 'red' : '#555';

  // Show/hide/update elements based on state
  switch (appState) {
    case 'LOADING':
      paymentSectionEl.style.display = 'none'; // Hide payment section while loading
      payButtonEl.disabled = true;
      payButtonEl.textContent = 'Loading...';
      break;

    case 'BASKET':
      paymentSectionEl.style.display = 'block'; // Show payment section
      payButtonEl.disabled = false; // Enable pay button
      payButtonEl.textContent = 'Pay Now';
      break;

    case 'IN_PROGRESS': // General processing state
    case 'PAYMENT_INITIATED': // Drop-in UI shown
    case 'PAYMENT_APPROVED': // Nonce received, verifying server-side
      paymentSectionEl.style.display = 'block';
      payButtonEl.disabled = true; // Disable button during processing
      payButtonEl.textContent = 'Processing...';
      break;

    case 'PAYMENT_FINISHED':
      paymentSectionEl.style.display = 'block';
      payButtonEl.disabled = true; // Payment complete, disable button
      payButtonEl.textContent = 'Payment Complete!';
      // Optionally hide the payment section or show a different success message
      // paymentSectionEl.innerHTML = '<p>Thank you for your purchase!</p>';
      break;

    default: // Includes error states if message indicates error
      paymentSectionEl.style.display = 'block';
      payButtonEl.disabled = true; // Keep disabled on error until resolved
      payButtonEl.textContent = 'Pay Now';
      break;
  }
}

// Helper function to update state and trigger UI refresh
function setAppState(newState, message) {
  console.log(`Setting state from ${appState} to ${newState}`);
  appState = newState;
  appMessage = message || ''; // Use provided message or clear it
  refreshUI(); // Update the UI immediately after state change
}

// Initial UI state setup on load
document.addEventListener('deviceready', () => {
    // Set initial state before store initialization might finish
    setAppState('LOADING', 'Initializing Payment...');
}, false);

// Ensure refreshUI is called initially if needed elsewhere
// refreshUI(); // Call if needed outside of setAppState