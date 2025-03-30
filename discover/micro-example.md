# Micro Example

In-App Purchase involves a fair amount of configuration on the platform side (App Store Connect, Google Play Console). However, the client-side integration using `cordova-plugin-purchase` can be straightforward for basic cases.

This minimal example demonstrates purchasing a consumable product using the plugin's **Test Platform**, which requires no external setup.

### HTML (`index.html`)

```markup
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' gap:; style-src 'self' 'unsafe-inline'; media-src *">
  <title>Micro Purchase Example</title>
  <style> body { padding-top: 40px; font-family: sans-serif; } button { padding: 10px; font-size: 1.1em; } </style>
</head>
<body>
  <div id="app">
    <p>Loading...</p>
  </div>
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
</html>
```

### JavaScript (`js/index.js`)

{% code lineNumbers="true" %}
```javascript
// Wait for the deviceready event
document.addEventListener('deviceready', onDeviceReady, false);

// Define the product ID we'll use
const MY_PRODUCT_ID = 'test_consumable_coins'; // A custom test consumable
const COINS_GRANTED = 100; // Amount granted per purchase

// Global reference to the product object once loaded
let myProduct = null;

function onDeviceReady() {
  console.log('Device is ready.');

  // Check if the plugin is available
  if (!window.CdvPurchase || !window.CdvPurchase.store) {
    console.error('CdvPurchase plugin is not available.');
    document.getElementById('app').innerHTML = 'Error: Purchase plugin not found.';
    return;
  }

  // Alias for convenience
  const { store, ProductType, Platform, LogLevel, ErrorCode } = CdvPurchase;

  // Set log level for debugging
  store.verbosity = LogLevel.DEBUG;

  // Setup error handler
  store.error(error => {
    console.error('STORE ERROR: ' + error.code + ' - ' + error.message);
    setStatus('Error: ' + error.message);
  });

  // Register our custom test product
  store.register({
    id: MY_PRODUCT_ID,
    type: ProductType.CONSUMABLE,
    platform: Platform.TEST,
    // Provide metadata for the test product
    title: '100 Gold Coins (Test)',
    description: 'Get some virtual currency for testing.',
    pricing: { price: '$0.99', currency: 'USD', priceMicros: 990000 }
  });

  // Setup event listeners
  store.when()
    .productUpdated(product => {
      console.log('Product updated: ' + product.id);
      if (product.id === MY_PRODUCT_ID) {
        myProduct = product; // Store reference to our product
      }
      refreshUI(); // Update the UI when product data changes
    })
    .approved(transaction => {
      console.log('Purchase Approved: ' + transaction.transactionId);
      setStatus('Purchase approved. Verifying...');
      // For the Test platform, verify() simulates success
      transaction.verify();
    })
    .verified(receipt => {
      console.log('Purchase Verified.');
      setStatus('Purchase verified. Finishing...');
      // Finish the transaction to consume it
      receipt.finish();
    })
    .finished(transaction => {
      console.log('Purchase Finished: ' + transaction.transactionId);
      // Grant the item to the user
      grantCoins(COINS_GRANTED);
      setStatus('Purchase complete! Coins granted.');
      refreshUI(); // Update UI after granting coins
    });

  // Initialize the store with the Test platform
  setStatus('Initializing store...');
  store.initialize([Platform.TEST])
    .then(() => {
      console.log('Store initialized!');
      setStatus('Store ready.');
      refreshUI(); // Render initial UI
    })
    .catch(err => {
      console.error('Store initialization failed:', err);
      setStatus('Store failed to initialize.');
    });
}

// Function to grant coins (uses localStorage for simplicity - NOT secure for real apps)
function grantCoins(amount) {
  const currentCoins = parseInt(localStorage.getItem('goldCoins') || '0');
  const newBalance = currentCoins + amount;
  localStorage.setItem('goldCoins', newBalance.toString());
  console.log(`Granted ${amount} coins. New balance: ${newBalance}`);
}

// Function to initiate the purchase
window.buyCoins = function() { // Make it global for the button
  if (!myProduct) {
    console.error('Product not loaded yet.');
    setStatus('Error: Product not ready.');
    return;
  }
  const offer = myProduct.getOffer();
  if (offer) {
    setStatus('Initiating purchase...');
    offer.order().then(result => {
      if (result && result.isError) {
        if (result.code === CdvPurchase.ErrorCode.PAYMENT_CANCELLED) {
          setStatus('Purchase cancelled.');
        } else {
          setStatus('Purchase failed: ' + result.message);
        }
        refreshUI(); // Refresh UI in case of cancellation/failure
      } else {
        // Purchase flow initiated, wait for events...
        setStatus('Purchase flow started...');
      }
    });
  } else {
    console.error('Offer not found for product.');
    setStatus('Error: Offer not available.');
  }
}

// Function to update the UI
function refreshUI() {
  const currentCoins = parseInt(localStorage.getItem('goldCoins') || '0');
  const appDiv = document.getElementById('app');
  if (!appDiv) return;

  let productInfo = '<p>Loading product...</p>';
  let purchaseButton = '';

  if (myProduct) {
    const offer = myProduct.getOffer();
    productInfo = `
      <h3>${myProduct.title}</h3>
      <p>${myProduct.description}</p>
      <p>Price: ${offer ? offer.pricingPhases[0].price : 'N/A'}</p>
    `;
    if (offer && offer.canPurchase) {
      purchaseButton = '<button onclick="buyCoins()">Buy ${COINS_GRANTED} Coins</button>';
    } else if (myProduct.owned) { // Should not happen for consumables, but good practice
      purchaseButton = '<p>(Already Owned - Error?)</p>';
    } else {
      purchaseButton = '<p>(Cannot purchase)</p>';
    }
  }

  appDiv.innerHTML = `
    <h2>Micro Purchase Example</h2>
    <p>Gold Coins: ${currentCoins}</p>
    <div id="status-message" style="font-style: italic; margin-bottom: 10px;">${appState.status || 'Ready.'}</div>
    <hr>
    ${productInfo}
    ${purchaseButton}
  `;
}

// Helper to update status message
let appState = { status: 'Initializing...' };
function setStatus(message) {
  console.log('Status: ' + message);
  appState.status = message;
  const statusEl = document.getElementById('status-message');
  if (statusEl) statusEl.textContent = message;
}

// Initial call to render loading state
document.addEventListener('DOMContentLoaded', () => {
  const appDiv = document.getElementById('app');
  if (appDiv) appDiv.innerHTML = '<p>Waiting for device ready...</p>';
});
```
{% endcode %}

### Running the Example

1.  Create a new Cordova project: `cordova create micro_example com.example.micro MicroExample`
2.  Navigate into the project: `cd micro_example`
3.  Add a platform: `cordova platform add android` (or `ios`)
4.  Install the purchase plugin: `cordova plugin add cordova-plugin-purchase`
5.  Replace `www/index.html` and `www/js/index.js` with the code above.
6.  Run the app on a device or emulator: `cordova run android` (or `ios`)

### Expected Behavior

1.  The app loads, initializes the store, and registers the test product.
2.  The UI displays the product title, description, and price ("$0.99").
3.  A "Buy 100 Coins" button is shown.
4.  Clicking the button shows a JavaScript `prompt()` dialog asking for confirmation (`Y`/`E`/Cancel).
5.  Entering `Y` simulates a successful purchase:
    *   Logs show `approved`, `verified`, `finished`.
    *   The "Gold Coins" count increases by 100.
    *   The status message updates accordingly.
    *   The "Buy" button remains available (as it's consumable).
6.  Entering `E` simulates a failure, logging an error and updating the status.
7.  Cancelling the prompt simulates user cancellation, logging a cancellation error and updating the status.

This demonstrates the basic flow of registering, displaying, ordering, and finishing a purchase using the Test platform, allowing you to build and debug your IAP logic locally.
