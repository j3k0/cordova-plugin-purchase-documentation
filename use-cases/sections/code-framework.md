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
