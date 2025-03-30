// Global state variables (consider a more robust state management approach for larger apps)
let appState = 'LOADING'; // Initial state
let appMessage = 'Initializing Payment...';

// Function to update the application's UI based on the current state
function refreshUI() {
  const appEl = document.getElementById('app'); // Main container element
  const messagesEl = document.getElementById('messages'); // Element for status messages
  const paymentSectionEl = document.getElementById('payment-section'); // Payment specific section
  const payButtonEl = document.getElementById('pay-button'); // The pay button

  if (!appEl || !messagesEl || !paymentSectionEl || !payButtonEl) {
    console.error('Required UI elements not found in index.html!');
    return;
  }

  console.log(`Refreshing UI - State: ${appState}, Message: ${appMessage}`);

  // Update status message
  messagesEl.textContent = appMessage;

  // Show/hide/update elements based on state
  switch (appState) {
    case 'LOADING':
      paymentSectionEl.style.display = 'none'; // Hide payment section while loading
      payButtonEl.disabled = true;
      break;

    case 'BASKET':
      paymentSectionEl.style.display = 'block'; // Show payment section
      payButtonEl.disabled = false; // Enable pay button
      payButtonEl.textContent = 'Pay Now';
      break;

    case 'IN_PROGRESS':
    case 'PAYMENT_INITIATED':
    case 'PAYMENT_APPROVED':
      paymentSectionEl.style.display = 'block';
      payButtonEl.disabled = true; // Disable button during processing
      payButtonEl.textContent = 'Processing...';
      break;

    case 'PAYMENT_FINISHED':
      paymentSectionEl.style.display = 'block';
      payButtonEl.disabled = true; // Payment complete, disable button
      payButtonEl.textContent = 'Payment Complete!';
      // Optionally hide the payment section or show a success message elsewhere
      // paymentSectionEl.innerHTML = '<p>Thank you for your purchase!</p>';
      break;

    default:
      // Handle unknown states or errors shown in messagesEl
      paymentSectionEl.style.display = 'block';
      payButtonEl.disabled = true;
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

// Initial UI state setup on load (called after initializeStore potentially)
// Ensure this is called appropriately, e.g., after deviceready and potentially after initializeStore resolves/fails
document.addEventListener('deviceready', () => {
    // Set initial state before store initialization might finish
    setAppState('LOADING', 'Initializing Payment...');
}, false);