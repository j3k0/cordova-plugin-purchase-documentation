# Micro Example

This minimal example demonstrates the basic client-side flow for purchasing a consumable product using the plugin's built-in **Test Platform**. This platform simulates purchases locally and requires no App Store or Google Play account setup, making it ideal for initial development and testing your UI logic.

## 1. HTML Setup (`index.html`)

First, set up a basic HTML structure to display information and trigger the purchase.

```html
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' gap:; style-src 'self' 'unsafe-inline'; media-src *">
  <title>Micro Purchase Example</title>
  <style>
    body { padding: 20px 10px; font-family: sans-serif; }
    button { padding: 10px; font-size: 1.1em; margin-top: 10px; }
    #status-message { font-style: italic; color: #555; margin-bottom: 10px; }
    #product-info { border: 1px solid #eee; padding: 10px; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>Micro Purchase Example (Test Platform)</h1>
  <div id="app">
    <p>Loading...</p>
  </div>
  <!-- Cordova script -->
  <script type="text/javascript" src="cordova.js"></script>
  <!-- Your application script -->
  <script type="text/javascript" src="js/index.js"></script>
</body>
</html>
```

*   **Explanation:** This HTML includes placeholders (`<div id="app">`) for dynamic content, basic styling, and includes the necessary Cordova and application JavaScript files. The `Content-Security-Policy` allows inline scripts for this simple example.

## 2. Initial JavaScript Setup (`js/index.js`)

Wait for the `deviceready` event before interacting with the plugin.

```javascript
// Wait for the deviceready event
document.addEventListener('deviceready', onDeviceReady, false);

// Define the product ID we'll use for testing
const MY_PRODUCT_ID = 'test_coins_consumable'; // A custom ID for our test consumable
const COINS_GRANTED = 100; // Amount granted per purchase

// Global reference to the product object once loaded
let myProduct = null; // Will hold the CdvPurchase.Product object

function onDeviceReady() {
  console.log('Device is ready.');

  // Check if the CdvPurchase plugin and store object are available
  if (!window.CdvPurchase || !window.CdvPurchase.store) {
    console.error('CdvPurchase plugin is not available.');
    setStatus('Error: Purchase plugin not found.');
    return;
  }

  console.log('CdvPurchase plugin loaded.');
  initializeStore();
}

// Helper to update status message on screen
function setStatus(message) {
  console.log('Status: ' + message);
  const statusEl = document.getElementById('status-message');
  if (statusEl) statusEl.textContent = message;
}

// Placeholder for UI refresh logic
function refreshUI() {
  // Implementation in Step 5
}

// Placeholder for purchase logic
window.buyCoins = function() {
  // Implementation in Step 6
}

// Placeholder for granting logic
function grantCoins(amount) {
  // Implementation in Step 7
}
```
*   **Explanation:** We wait for `deviceready`, define constants for our test product, check if the plugin is loaded, and set up placeholder functions. `setStatus` is a helper for displaying messages.

## 3. Initialize Store & Register Product

Inside `onDeviceReady`, after the check, call `initializeStore`.

```javascript
// Add this function in js/index.js
async function initializeStore() {
  setStatus('Initializing Store...');

  // Alias for convenience
  const { store, ProductType, Platform, LogLevel } = CdvPurchase;

  // Optional: Set log level for detailed debugging during development
  store.verbosity = LogLevel.DEBUG;

  // Optional: Basic error handler
  store.error(err => {
    console.error("STORE ERROR: " + err.code + " " + err.message);
    setStatus('Error: ' + err.message);
  });

  // Register our custom test product
  // For the Test platform, we can define product details directly here.
  store.register({
    id: MY_PRODUCT_ID,
    type: ProductType.CONSUMABLE,
    platform: Platform.TEST,
    // Provide metadata for the test product:
    title: '100 Test Coins',
    description: 'Virtual currency for testing purposes.',
    pricing: { price: '$0.99', currency: 'USD', priceMicros: 990000 }
  });

  // Setup event listeners (before initializing)
  setupListeners();

  // Initialize the store ONLY with the Test platform
  try {
    await store.initialize([Platform.TEST]);
    console.log('Store initialized!');
    setStatus('Store ready.');
    refreshUI(); // Render initial UI now that store is ready
  } catch (err) {
    console.error('Store initialization failed:', err);
    setStatus('Store failed to initialize.');
  }
}
```
*   **Explanation:** We set up logging and error handling. `store.register` tells the plugin about our test product, including its type and platform. For `Platform.TEST`, we can include `title`, `description`, and `pricing` directly. `store.initialize([Platform.TEST])` activates *only* the test adapter.

## 4. Setup Event Listeners

Define how your app reacts to purchase events. Add this function call within `initializeStore` *before* `store.initialize()`.

```javascript
// Add this function in js/index.js
function setupListeners() {
  const { store, ErrorCode } = CdvPurchase;
  store.when()
    .productUpdated(product => {
      // Called when product details are loaded or updated
      console.log('Product updated: ' + product.id);
      if (product.id === MY_PRODUCT_ID) {
        myProduct = product; // Store reference for later use
      }
      refreshUI(); // Update the UI
    })
    .approved(transaction => {
      console.log('Purchase Approved: ' + transaction.transactionId);
      setStatus('Purchase approved. Verifying...');
      // For the Test platform, verify() simulates success immediately
      // In a real app, this would call your validation server.
      transaction.verify();
    })
    .verified(receipt => {
      console.log('Purchase Verified.');
      setStatus('Purchase verified. Finishing...');
      // Purchase is valid. Unlock content / grant item.
      // Finish the transaction to acknowledge/consume it.
      receipt.finish();
    })
    .finished(transaction => {
      console.log('Purchase Finished: ' + transaction.transactionId);
      // Grant the item to the user
      grantCoins(COINS_GRANTED);
      setStatus(`Purchase complete! ${COINS_GRANTED} coins granted.`);
      refreshUI(); // Update UI after granting coins
    })
    .cancelled(transaction => {
      // Purchase flow was cancelled by the user.
      console.log('Purchase Cancelled: ' + transaction.transactionId);
      setStatus('Purchase cancelled.');
      refreshUI();
    });
    // Note: .error() is handled globally in initializeStore
}
```
*   **Explanation:** We use `store.when()` to chain listeners. `productUpdated` updates our `myProduct` variable and refreshes the UI. The `approved` -> `verified` -> `finished` chain represents the successful purchase flow. `verify()` on the Test platform is a mock. `finish()` marks the consumable as ready for repurchase. `cancelled` handles user cancellation.

## 5. Display Product and Balance

Implement the `refreshUI` function to show the current coin balance and product details.

```javascript
// Replace the placeholder refreshUI function in js/index.js
function refreshUI() {
  // Get current balance (using localStorage for simplicity - NOT secure for real apps)
  const currentCoins = parseInt(localStorage.getItem('goldCoins') || '0');
  const appDiv = document.getElementById('app');
  if (!appDiv) return;

  let productHtml = '<div id="product-info"><p>Loading product...</p></div>';
  let purchaseButtonHtml = '';
  let statusHtml = `<div id="status-message">${appState.status || 'Ready.'}</div>`; // Assuming appState exists

  if (myProduct) {
    const offer = myProduct.getOffer(); // Get the default offer
    productHtml = `
      <div id="product-info">
        <h3>${myProduct.title}</h3>
        <p>${myProduct.description}</p>
        <p>Price: ${offer?.pricing?.price ?? 'N/A'}</p>
      </div>
    `;
    if (offer?.canPurchase) {
      purchaseButtonHtml = '<button id="buy-button" onclick="buyCoins()">Buy ${COINS_GRANTED} Coins</button>';
    } else {
      purchaseButtonHtml = '<p>(Cannot purchase at this time)</p>';
    }
  }

  appDiv.innerHTML = `
    <h2>Micro Purchase Example (Test Platform)</h2>
    <p><b>Gold Coins: ${currentCoins}</b></p>
    ${statusHtml}
    <hr>
    ${productHtml}
    ${purchaseButtonHtml}
  `;
}

// Add a simple state object if you haven't already
let appState = { status: 'Initializing...' };
// Ensure setStatus updates this state
function setStatus(message) {
  console.log('Status: ' + message);
  appState.status = message;
  const statusEl = document.getElementById('status-message');
  if (statusEl) statusEl.textContent = message;
}
```
*   **Explanation:** This function reads the coin balance from `localStorage` (use secure storage or a server in a real app!). It then checks if `myProduct` has been loaded. If so, it displays its title, description, price, and a "Buy" button if `offer.canPurchase` is true.

## 6. Implement Purchase Function

Define the `buyCoins` function called by the button's `onclick`.

```javascript
// Replace the placeholder buyCoins function in js/index.js
window.buyCoins = function() { // Make it global for onclick
  if (!myProduct) {
    setStatus('Error: Product not ready.');
    return;
  }
  const offer = myProduct.getOffer(); // Get the default offer
  if (offer) {
    setStatus('Initiating purchase...');
    offer.order().then(result => {
      // This promise resolves when the initial purchase flow interaction
      // is done (e.g., user cancelled, or platform accepted the request).
      // The actual purchase result comes via the .approved/.cancelled listeners.
      if (result && result.isError) {
        // Handle potential errors during order initiation (rare)
        // Note: User cancellation is typically handled by the .cancelled listener
        setStatus(`Order failed: ${result.message}`);
        refreshUI();
      } else {
        // Purchase flow started, waiting for events...
        setStatus('Purchase flow started...');
      }
    });
  } else {
    setStatus('Error: Offer not available.');
  }
}
```
*   **Explanation:** It finds the product's default offer and calls `offer.order()`. This triggers the Test platform's `prompt()`. The promise returned by `order()` resolves quickly after the user interacts with the prompt (or if there's an immediate error); the final outcome is handled by the event listeners set up earlier.

## 7. Implement Granting Logic

Define the `grantCoins` function called by the `.finished()` listener.

```javascript
// Replace the placeholder grantCoins function in js/index.js
function grantCoins(amount) {
  const currentCoins = parseInt(localStorage.getItem('goldCoins') || '0');
  const newBalance = currentCoins + amount;
  localStorage.setItem('goldCoins', newBalance.toString());
  console.log(`Granted ${amount} coins. New balance: ${newBalance}`);
  // UI is refreshed by the .finished listener calling refreshUI()
}
```
*   **Explanation:** This function updates the coin balance in `localStorage`. In a real app, this would involve updating secure storage or making a server call.

## Testing the Example

1.  Create a new Cordova project.
2.  Add a platform (`android` or `ios`).
3.  Install the purchase plugin (`cordova plugin add cordova-plugin-purchase`).
4.  Replace `www/index.html` and create `www/js/index.js` with the code from the steps above.
5.  Run the app (`cordova run android` or `cordova run ios`).

When you click "Buy 100 Coins":
*   A **JavaScript `prompt()`** will appear: "Do you want to purchase test_coins_consumable for $0.99? Enter "Y" to confirm. Enter "E" to fail with an error. Anything else to cancel."
*   **Enter "Y"**: Simulates success. You'll see logs for `approved`, `verified`, `finished`, the status message updates, and the coin count increases.
*   **Enter "E"**: Simulates failure. An error is logged, and the status message updates.
*   **Cancel or enter anything else**: Simulates user cancellation. The `.cancelled` listener fires, and the status message updates.

This micro example covers the essential client-side steps for handling a purchase using the Test platform, providing a foundation for building more complex IAP logic. Remember to replace the Test platform specifics with actual platform integration and add server-side validation for production apps.
