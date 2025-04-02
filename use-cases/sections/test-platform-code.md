## Code Implementation

This section explains how to use the `Test` platform adapter for local development and testing without needing actual store accounts or network connectivity to external services.

### 1. Base Framework

Ensure you have the basic HTML structure and initial JavaScript setup (waiting for `deviceready`, basic plugin checks, `setStatus` helper, placeholder functions) as outlined in the [Code Framework section](code-framework.md).

#### index.html

Assuming you're starting from a blank Cordova project, let's set up the minimal HTML needed for the tutorials.

**Step 1: Modify `www/index.html`**

Replace the default `<body>` content with the following structure:

```html
<body>
  <div class="app">
    <h1>In-App Purchase Demo</h1>
    <!-- Area for status messages and errors -->
    <div id="messages" style="font-style: italic; color: #555; margin-bottom: 10px;">Loading...</div>
    <hr>
    <!-- Area to display product details -->
    <div id="product-details"></div>
    <hr>
    <!-- Area for other UI elements (like balance, feature status) -->
    <div id="user-status"></div>
     <hr>
    <!-- Area for management buttons -->
    <div id="management-buttons"></div>
  </div>

  <!-- Cordova script -->
  <script type="text/javascript" src="cordova.js"></script>
  <!-- Your application script -->
  <script type="text/javascript" src="js/index.js"></script>
</body>
```
*   **Explanation:** We create a main container (`#app`) and add specific `div` elements (`#messages`, `#product-details`, `#user-status`, `#management-buttons`) that subsequent code examples will use to display information dynamically.

**Step 2: Adjust Content Security Policy (CSP)**

In the `<head>` of your `www/index.html`, find the `<meta http-equiv="Content-Security-Policy" ...>` tag. You need to modify the `connect-src` directive to allow connections to your receipt validation server. Also, ensure `'unsafe-inline'` is present in `script-src` or `default-src` if your examples use inline `onclick` handlers (though using `addEventListener` in JavaScript is generally preferred).

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self' data: gap: https://ssl.gstatic.com 'unsafe-eval';
               style-src 'self' 'unsafe-inline';
               media-src *;
               img-src 'self' data: content:;
               connect-src 'self' https://your-validator-server.com;">
               <!-- Add other necessary sources -->
```
*   **Explanation:**
    *   Replace `https://your-validator-server.com` with the actual URL of your receipt validation service (e.g., `https://validator.iaptic.com`). If you don't use a validator initially, you might omit this, but you'll need it later for secure implementations.
    *   The example keeps other default Cordova CSP directives. Adjust them based on your app's needs.

**Step 3: (Optional) Clean Up Default CSS**

You might want to comment out or remove the default CSS (`www/css/index.css`) from the Cordova template project to avoid style conflicts with the simple examples.

#### JavaScript (`www/js/index.js`)

This section provides the minimal JavaScript foundation needed to start using the `cordova-plugin-purchase` plugin in your `www/js/index.js` file (or equivalent).

{% code title="www/js/index.js" lineNumbers="true" %}
```javascript
// Wait for Cordova's deviceready event
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
  console.log('Device is ready.');
  setStatus('Device ready.'); // Update UI status

  // --- Essential Plugin Check ---
  // Verify that the CdvPurchase namespace and store object are available.
  if (!window.CdvPurchase || !window.CdvPurchase.store) {
    const msg = 'CdvPurchase plugin is not available. Ensure it is installed and loaded correctly.';
    console.error(msg);
    setStatus('ERROR: ' + msg);
    // Stop further initialization if the plugin isn't found.
    return;
  }

  // --- Basic Setup (Before Initialization) ---
  const { store, LogLevel, ErrorCode } = CdvPurchase;
  console.log('CdvPurchase.store available. Version ' + store.version);

  // Set the desired verbosity level for the plugin's logger.
  // LogLevel.DEBUG provides the most detailed logs, useful for development.
  // Use LogLevel.INFO or LogLevel.WARNING for production.
  store.verbosity = LogLevel.DEBUG;

  // Register a global error handler for the store.
  // This catches general plugin errors (initialization, setup, etc.).
  // Purchase-specific errors are typically handled via promises/callbacks.
  store.error(error => {
    console.error('STORE ERROR: Code=' + error.code + ' Message=' + error.message);
    setStatus('ERROR: ' + error.message);
  });

  // --- Defer Specific Initialization ---
  // Call the main initialization function for your specific use case.
  // This function (defined elsewhere in your code or the tutorial)
  // will handle product registration, validator setup, event listeners,
  // and calling store.initialize().
  initializeStoreAndSetupListeners();

  // Initial UI refresh (might show loading states until products load)
  refreshUI();
}

// --- Helper Functions (Example) ---

// Function to update a status message element in the HTML
function setStatus(message) {
  console.log('[Status] ' + message);
  const statusEl = document.getElementById('messages'); // Assumes an element with id="messages" exists
  if (statusEl) {
    statusEl.textContent = message;
  }
}

// --- Placeholder Functions (to be implemented by specific use-case guides) ---

// This function will be implemented in specific guides to register products,
// set the validator, setup 'when' listeners, and call store.initialize().
function initializeStoreAndSetupListeners() {
  console.log('Placeholder: initializeStoreAndSetupListeners() called.');
  // Example structure (implement in specific guides):
  // const { store, Platform, ProductType } = CdvPurchase;
  // store.register([...]);
  // store.validator = '...';
  // store.when()...
  // store.initialize([...]).then(...);
  setStatus('Store setup needs implementation.');
}

// This function will be implemented in specific guides to update the UI
// based on product data, ownership status, etc.
function refreshUI() {
  console.log('Placeholder: refreshUI() called.');
  // Example structure (implement in specific guides):
  // const product = CdvPurchase.store.get(...);
  // Update HTML elements based on product.title, product.pricing, product.owned, etc.
}

// Make purchase function global if called directly from HTML onclick
// window.myPurchaseFunction = function() { ... }

```
{% endcode %}

**Explanation:**

1.  **Wait for `deviceready` (Line 2):** Essential first step for any Cordova plugin interaction.
2.  **Plugin Check (Lines 8-14):** Verifies that `CdvPurchase.store` is available before proceeding.
3.  **Basic Setup (Lines 17-29):**
    *   Aliases common plugin members (`store`, `LogLevel`, etc.) for convenience.
    *   Sets `store.verbosity` to `DEBUG` for detailed logging during development.
    *   Sets up a global `store.error` handler to catch and log general plugin errors.
4.  **Deferred Initialization (Line 35):** Calls `initializeStoreAndSetupListeners()`. This function is intentionally left as a placeholder here. Specific use-case guides (like setting up subscriptions or consumables) will provide the implementation for this function, which will include `store.register()`, `store.validator = ...`, `store.when()...`, and `store.initialize()`.
5.  **Initial UI Refresh (Line 38):** Calls `refreshUI()`, another placeholder function that specific guides will implement to display product information and purchase status.
6.  **Helper Functions (Lines 43-51):** Includes a basic `setStatus` function as an example for updating the UI.
7.  **Placeholders (Lines 54-72):** Empty definitions for `initializeStoreAndSetupListeners` and `refreshUI`, their specific logic depends on the use case and will be provided in subsequent steps of the tutorials.

This minimal base ensures the plugin is loaded and basic logging/error handling is in place before diving into platform-specific or product-type-specific configurations in the main use-case guides.

### 2. Initialization (`initializeStoreAndSetupListeners`)

Implement the `initializeStoreAndSetupListeners` function to configure and initialize the Test platform. This involves registering test products and setting up event listeners.

{% code title="www/js/index.js (initializeStoreAndSetupListeners)" lineNumbers="true" %}
```javascript
// This function should be called by onDeviceReady after basic setup
function initializeStoreAndSetupListeners() {
  console.log('Setting up store for Test Platform...');
  setStatus('Initializing Test Store...');

  const { store, ProductType, Platform, LogLevel, ErrorCode, PaymentMode, RecurrenceMode } = CdvPurchase;

  // --- Register Test Products ---
  // You MUST register the products you intend to use with the Test platform.
  store.register([
    // 1. Using built-in test products (convenient for standard types)
    { id: 'test-consumable', type: ProductType.CONSUMABLE, platform: Platform.TEST },
    { id: 'test-non-consumable', type: ProductType.NON_CONSUMABLE, platform: Platform.TEST },
    { id: 'test-subscription', type: ProductType.PAID_SUBSCRIPTION, platform: Platform.TEST },
    // This one starts as already owned/approved
    { id: 'test-subscription-active', type: ProductType.PAID_SUBSCRIPTION, platform: Platform.TEST },
    // This one simulates a purchase failure
    { id: 'test-consumable-fail', type: ProductType.CONSUMABLE, platform: Platform.TEST },

    // 2. Defining and registering a custom test product inline
    {
      id: 'custom_test_feature',
      type: ProductType.NON_CONSUMABLE,
      platform: Platform.TEST,
      title: 'Unlock Custom Feature (Test)',
      description: 'A non-consumable defined directly in register.',
      pricing: { // Simple pricing for non-consumable
        price: '$1.49',
        currency: 'USD',
        priceMicros: 1490000
      }
    },
    // 3. Defining a custom test subscription inline
    {
      id: 'custom_test_sub_monthly',
      type: ProductType.PAID_SUBSCRIPTION,
      platform: Platform.TEST,
      title: 'Custom Monthly Sub (Test)',
      description: 'A subscription with a trial.',
      pricing: [ // Array of PricingPhase for subscriptions
        { // Trial Phase
          price: '$0.00', currency: 'USD', priceMicros: 0,
          paymentMode: PaymentMode.FREE_TRIAL,
          recurrenceMode: RecurrenceMode.FINITE_RECURRING,
          billingCycles: 1, billingPeriod: 'P1W' // 1 week trial
        },
        { // Regular Phase
          price: '$4.99', currency: 'USD', priceMicros: 4990000,
          paymentMode: PaymentMode.PAY_AS_YOU_GO,
          recurrenceMode: RecurrenceMode.INFINITE_RECURRING,
          billingPeriod: 'P1M' // $4.99 per month
        }
      ]
    }
  ]);

  // --- Optional: Mock Validator ---
  // If you set a validator URL, the Test platform provides a mock function
  // that simulates a successful validation after a short delay.
  // This helps test the .verified() event flow.
  // store.validator = "TEST_VALIDATOR"; // Any non-empty string enables mock validation

  // --- Setup Event Listeners ---
  store.when()
    .productUpdated(product => {
      console.log('Product updated: ' + product.id);
      refreshUI(); // Update the UI with product details
    })
    .approved(transaction => {
      console.log(`Approved: ![{transaction.transactionId} for ](<html>
<head><title>405 Not Allowed</title></head>
<body bgcolor="white">
<center><h1>405 Not Allowed</h1></center>
</body>
</html> "{transaction.transactionId} for ")
{transaction.products[0].id}`);
      setStatus(`Approved ${transaction.products[0].id}. Verifying...`);
      // For the Test platform, verify() simulates success immediately (or after 500ms if validator is set)
      transaction.verify();
    })
    .verified(receipt => {
      console.log(`Verified: ${receipt.id}`);
      setStatus(`Verified ${receipt.collection[0]?.id ?? ''}. Finishing...`);
      // Finish the transaction to acknowledge/consume it
      receipt.finish();
    })
    .finished(transaction => {
      console.log(`Finished: ${transaction.transactionId} for ${transaction.products[0].id}`);
      setStatus(`Purchase complete for ${transaction.products[0].id}!`);
      // Grant entitlement based on product type
      if (transaction.products[0].id.includes('consumable')) {
        grantCoins(1); // Example: grant 1 unit
      } else {
        grantEntitlement(transaction.products[0].id); // For non-consumables/subs
      }
      refreshUI(); // Update UI after granting
    })
    .cancelled(transaction => {
      console.log('Cancelled:', transaction.transactionId);
      setStatus('Purchase cancelled.');
      refreshUI();
    });
    // Global store.error handler is already set up in initial script

  // --- Initialize the Store ---
  // Initialize ONLY the Test platform.
  store.initialize([Platform.TEST])
    .then(() => {
      console.log('Test Store initialized successfully.');
      setStatus('Test Store ready.');
      refreshUI(); // Render the UI with initial product data
    })
    .catch(err => {
      console.error('Test Store initialization failed:', err);
      setStatus('Test Store failed to initialize.');
    });
}

// --- UI Rendering ---
// (Includes placeholders for balance/feature status - adapt as needed)
let userCoinBalance = 0; // Example balance
const FEATURE_KEY = 'isCustomFeatureUnlocked'; // Example key

function refreshUI() {
  console.log('Refreshing Test UI...');
  const { store, Platform, Utils } = CdvPurchase;

  const productsEl = document.getElementById('product-details');
  const statusEl = document.getElementById('user-status');
  if (!productsEl || !statusEl) return;

  // Display Balance/Feature Status (Example)
  const featureUnlocked = localStorage.getItem(FEATURE_KEY) === 'YES';
  statusEl.innerHTML = `<b>Coins: ${userCoinBalance}</b> | <b>Custom Feature: ${featureUnlocked ? 'Unlocked' : 'Locked'}</b>`;

  // Display Products
  productsEl.innerHTML = store.products
    .filter(p => p.platform === Platform.TEST) // Show only test products
    .map(product => {
      let productHtml = `<div><h4>${product.title || product.id} (${product.type})</h4>`;
      if (product.description) productHtml += `<p>${product.description}</p>`;

      const offer = product.getOffer(); // Get the default offer
      if (offer) {
        const priceDetails = offer.pricingPhases.map(phase => {
           let phaseDesc = `${phase.price}`;
           if (phase.billingPeriod) phaseDesc += ` / ${Utils.formatDurationEN(phase.billingPeriod, { omitOne: true })}`;
           if (phase.paymentMode === PaymentMode.FREE_TRIAL) phaseDesc = `Free Trial (${Utils.formatDurationEN(phase.billingPeriod)})`;
           return phaseDesc;
        }).join(' then ');
        productHtml += `<p>Price: ${priceDetails}</p>`;

        // Determine if owned (using store.owned which checks verified/local)
        const owned = store.owned(product);

        if (owned && product.type !== ProductType.CONSUMABLE) {
          productHtml += `<p><em>(Owned)</em></p>`;
          if (product.type === ProductType.PAID_SUBSCRIPTION) {
             const purchase = store.findInVerifiedReceipts(product) ?? store.findInLocalReceipts(product);
             if (purchase?.expirationDate) {
                 productHtml += `<p>Expires: ${purchase.expirationDate.toLocaleDateString()}</p>`;
             }
          }
        } else if (offer.canPurchase) {
          productHtml += `<button onclick="buyTestProduct('${product.id}')">Buy</button>`;
        } else {
          productHtml += `<p>(Cannot purchase)</p>`;
        }
      } else {
        productHtml += '<p>Offer not available.</p>';
      }
      productHtml += `</div>`;
      return productHtml;
    }).join('<hr/>');
}

// --- Placeholder for Purchase Action ---
window.buyTestProduct = function(productId) {
  console.log(`Placeholder: buyTestProduct('${productId}') called.`);
  alert('Purchase logic needs implementation (see test-platform-purchase.js).');
};

// --- Placeholder for Granting Logic ---
function grantCoins(amount) {
  console.log(`Placeholder: Granting ${amount} coins.`);
  userCoinBalance += amount;
  // Persist balance securely in a real app
}
function grantEntitlement(productId) {
  console.log(`Placeholder: Granting entitlement for ${productId}.`);
  if (productId === 'custom_test_feature') {
    localStorage.setItem(FEATURE_KEY, 'YES'); // INSECURE EXAMPLE
  }
  // Handle subscription activation if needed
}

// Initial UI update on device ready
document.addEventListener('deviceready', () => {
  if (typeof initializeStoreAndSetupListeners === 'function') {
     // Called by onDeviceReady
  } else {
     initializeStoreAndSetupListeners = initializeStore;
     initializeStoreAndSetupListeners();
  }
  refreshUI();
}, false);

// Ensure setStatus and Utils are defined
if (typeof setStatus !== 'function') { setStatus = (message) => console.log('[Status] ' + message); }
if (!CdvPurchase.Utils) CdvPurchase.Utils = {};
if (!CdvPurchase.Utils.formatDurationEN) { CdvPurchase.Utils.formatDurationEN = (iso) => iso || ''; }

```
{% endcode %}

**Explanation:**

*   **Register Test Products (Lines 11-65):**
    *   You **must** register any product ID you want to use with `Platform.TEST`.
    *   You can use built-in product definitions like `CdvPurchase.Test.testProducts.CONSUMABLE` (Lines 15-24) for convenience. See the code comments or API docs for available built-in products (`CONSUMABLE`, `NON_CONSUMABLE`, `PAID_SUBSCRIPTION`, `PAID_SUBSCRIPTION_ACTIVE`, `CONSUMABLE_FAILING`).
    *   You can also define **custom test products** directly within `store.register` (Lines 27-65). Provide `id`, `type`, `platform: Platform.TEST`, and optionally `title`, `description`, and `pricing`. The `pricing` can be a simple object for one-time purchases or an array of `PricingPhase` objects for subscriptions.
*   **Mock Validator (Lines 68-72):** If you set `store.validator` to any non-empty string (e.g., `"TEST_VALIDATOR"`), the Test platform will simulate a successful validation response after a 500ms delay when `transaction.verify()` is called. This allows you to test the `.verified()` event flow.
*   **Event Listeners (Lines 75-100):** Basic listeners are set up:
    *   `productUpdated`: Refreshes the UI when product details are ready.
    *   `approved`: Calls `transaction.verify()` (which triggers the mock validation if enabled).
    *   `verified`: Calls `receipt.finish()` to complete the transaction.
    *   `finished`: Calls functions to grant the item (`grantCoins` or `grantEntitlement`) and refreshes the UI.
    *   `cancelled`: Updates the status message.
*   **Initialize Store (Lines 103-112):** Calls `store.initialize([Platform.TEST])` to activate *only* the Test adapter.

### 3. Purchase Flow (`buyTestProduct`)

Implement the function called by your "Buy" buttons to initiate a test purchase using `offer.order()`.

{% code title="www/js/index.js (buyTestProduct)" lineNumbers="true" %}
```javascript
// This function is called by the "Buy" buttons in the UI
window.buyTestProduct = function(productId) {
  console.log(`Buy button clicked for test product: ${productId}`);
  const { store, Platform, ErrorCode } = CdvPurchase;

  const product = store.get(productId, Platform.TEST);
  const offer = product?.getOffer(); // Get the default offer

  if (offer) {
    setStatus(`Initiating purchase for ${productId}...`);
    console.log(`Ordering offer: ${offer.id}`);

    offer.order()
      .then(result => {
        // Promise resolves when the prompt() is dismissed or if there's an immediate error.
        // The final outcome (approved, cancelled, failed) is handled by the event listeners.
        if (result && result.isError) {
          // This typically catches errors *before* the prompt, like "cannot purchase".
          // The prompt interaction itself usually triggers listeners, not this promise rejection.
          setStatus(`Order failed: ${result.message}`);
        } else {
          // Order initiated, waiting for user interaction with the prompt...
          // Status will be updated by .approved, .cancelled, or .error listeners.
        }
        refreshUI(); // Refresh UI, e.g., disable button temporarily
      })
      .catch(err => {
        // Catch unexpected errors during order initiation
        console.error(`Unexpected error ordering ${productId}:`, err);
        setStatus('Unexpected error during purchase.');
        refreshUI();
      });

  } else {
    console.error(`Cannot purchase: Product (${productId}) or offer not found.`);
    setStatus('Error: Unable to purchase. Product/Offer missing.');
  }
}

// --- Explanation of the Prompt ---
/*
When offer.order() is called for Platform.TEST, the following happens:

1. A JavaScript `prompt()` dialog appears in the browser/WebView.
2. The prompt message asks:
   `Do you want to purchase ![{productId} for ](<html>
<head><title>405 Not Allowed</title></head>
<body bgcolor="white">
<center><h1>405 Not Allowed</h1></center>
</body>
</html> "{productId} for ")
{price}? Enter "Y" to confirm. Enter "E" to fail with an error. Anything else to cancel.`
3. User Interaction:
   - Entering "Y" (case-insensitive) and clicking OK: Simulates a successful purchase approval. The `.approved()` event listener will be triggered shortly after.
   - Entering "E" (case-insensitive) and clicking OK: Simulates a purchase failure. The global `store.error()` handler will be triggered with an ErrorCode.PURCHASE error.
   - Clicking "Cancel" or entering anything else and clicking OK: Simulates the user cancelling the purchase. The `.cancelled()` event listener will be triggered.
*/

// Ensure setStatus and refreshUI are defined (should be in initialization script)
if (typeof setStatus !== 'function') { setStatus = (message) => console.log('[Status] ' + message); }
if (typeof refreshUI !== 'function') { refreshUI = () => console.log('Placeholder: refreshUI()'); }

```
{% endcode %}

**Explanation:**

*   **Get Offer (Lines 6-8):** Retrieves the product and its default offer.
*   **Call `offer.order()` (Line 14):** This is the key call to start the purchase simulation.
*   **Prompt Interaction (Lines 30-42):** When `offer.order()` runs for `Platform.TEST`:
    *   A standard JavaScript `prompt()` dialog appears.
    *   It asks the user to confirm (`Y`), fail (`E`), or cancel.
    *   **"Y"**: Simulates approval -> triggers `.approved()` listener.
    *   **"E"**: Simulates failure -> triggers global `store.error()` handler.
    *   **Cancel/Other**: Simulates cancellation -> triggers `.cancelled()` listener.
*   **Promise Handling (Lines 15-28):** The promise returned by `order()` resolves/rejects quickly after the prompt is dismissed, mainly indicating if the *request* was initiated or immediately failed/cancelled. The final purchase *outcome* is handled by the event listeners.

This setup allows you to test the full client-side purchase lifecycle locally using simple prompts for interaction. Remember to replace the Test platform logic with real platform adapters and server-side validation for production.
