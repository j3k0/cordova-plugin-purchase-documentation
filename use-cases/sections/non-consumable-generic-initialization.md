### Initialization & UI Setup (Non-Consumable)

This section guides you through setting up the initial HTML and JavaScript required to initialize the purchase plugin, register your non-consumable product, and display its information to the user before they attempt a purchase.

**Step 1: Basic HTML Structure**

*   **What:** We need a place in our HTML to display the status of the feature (locked/unlocked) and the details of the in-app product used to unlock it.
*   **Why:** This provides visual feedback to the user about the product and their current access level.

Replace the `<body>` of your `www/index.html` with this minimal structure:

```markup
<!-- www/index.html -->
<body>
  <div class="app">
    <h1>My App Feature</h1>
    <p id="feature-status">Feature Status: Loading...</p>
    <hr/>
    <div id="nonconsumable1-purchase">
      <h2>Unlock Feature</h2>
      <p>Loading purchase details...</p>
    </div>
    <hr/>
    <!-- Placeholder for error messages -->
    <div id="error-display" style="color: red; margin-top: 10px;"></div>
  </div>
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
```

*   Remember to adjust your `Content-Security-Policy` meta tag in `index.html` if you plan to use a remote validator or load external resources. Add `'unsafe-inline'` if you use `onclick` attributes directly.

**Step 2: Initial JavaScript Framework**

*   **What:** Create `www/js/index.js` and set up the essential event listener for `deviceready`.
*   **Why:** Cordova plugins are only guaranteed to be available *after* the `deviceready` event fires. All plugin interactions must happen after this point.

```javascript
// www/js/index.js

// Wait for Cordova to be ready
document.addEventListener('deviceready', initializeStore);
document.addEventListener('deviceready', refreshFeatureUI); // Refresh UI once device is ready

// Key for storing unlock status (using localStorage for simplicity)
const FEATURE_KEY = 'myFeatureUnlocked';

function initializeStore() {
    console.log('Device is ready, initializing store...');

    // Check if the CdvPurchase plugin is available
    if (!window.CdvPurchase || !window.CdvPurchase.store) {
        console.error('Store plugin not available');
        document.getElementById('feature-status').textContent = 'Error: Store plugin failed to load.';
        return;
    }

    const { store, ProductType, Platform, LogLevel } = CdvPurchase;
    console.log('Store plugin version: ' + store.version);

    // Optional: Set log level for debugging
    store.verbosity = LogLevel.DEBUG; // Use DEBUG for development, ERROR or QUIET for production

    // --- Steps below will be added incrementally ---

    // 1. Register Products
    // 2. Setup Error Handling
    // 3. Setup Event Listeners
    // 4. Initialize the Store

}

// --- UI Refresh Functions ---
// We will implement these functions in the next steps

function refreshFeatureUI() {
    console.log('Refreshing feature UI based on stored status...');
    // (Implementation in Step 6)
}

function refreshProductUI(product) {
    console.log('Refreshing product UI for: ' + (product ? product.id : 'N/A'));
    // (Implementation in Step 7)
}

// --- Purchase Action ---
// We will define this function later, it will be called by the buy button.
// window.purchaseFeature = function() { ... };
```

**Step 3: Register Your Product**

*   **What:** Tell the plugin about your non-consumable product using `store.register()`.
*   **Why:** The plugin needs to know the `id`, `type`, and `platform` of the products you want to manage so it can fetch their details (like price and title) from the respective app store.

Add the following inside the `initializeStore` function (where indicated by the comment):

```javascript
// Inside initializeStore()

// 1. Register Products
console.log('Registering products...');
// Replace 'nonconsumable1' with your actual product ID for the platform.
// Use store.defaultPlatform() for convenience if supporting only one platform initially.
store.register({
    id: 'nonconsumable1', // <<< YOUR PRODUCT ID HERE
    type: ProductType.NON_CONSUMABLE,
    platform: store.defaultPlatform(), // Or Platform.GOOGLE_PLAY, Platform.APPLE_APPSTORE
});
```

**Step 4: Setup Error Handling**

*   **What:** Use `store.error()` to register a listener for any errors the plugin might encounter.
*   **Why:** This helps in debugging and allows you to inform the user if something goes wrong (e.g., network issues, configuration problems).

Add the error handler inside `initializeStore`:

```javascript
// Inside initializeStore()

// 2. Setup Error Handling
console.log('Setting up error handler...');
store.error(function(error) {
    console.error('STORE ERROR ' + error.code + ': ' + error.message);
    const errorEl = document.getElementById('error-display');
    if (errorEl) {
        errorEl.textContent = `Error: ${error.message}`;
        // Clear the error after some time
        setTimeout(() => { if (errorEl.textContent === `Error: ${error.message}`) errorEl.textContent = ''; }, 10000);
    }
});
```

**Step 5: Setup Event Listeners**

*   **What:** Use `store.when()` to listen for specific events, particularly `productUpdated` (when product details like price are loaded) and `receiptUpdated` (when purchase information changes).
*   **Why:** The plugin operates asynchronously. These listeners allow your UI to react when product data is available or when the user's purchase/ownership status changes.

Add the event listeners inside `initializeStore`:

```javascript
// Inside initializeStore()

// 3. Setup Event Listeners
console.log('Setting up event listeners...');
store.when()
    // Called when product data is loaded or updated.
    .productUpdated(product => {
        console.log('Product updated: ' + product.id);
        refreshProductUI(product); // Update the specific product's UI
    })
    // Called when purchase information changes
    .receiptUpdated(receipt => {
        console.log('Receipt updated');
        refreshFeatureUI(); // Re-check feature status based on purchases
    });
    // We will add .approved(), .verified(), .finished() handlers later in the purchase flow section.
```

**Step 6: Initialize the Store**

*   **What:** Call `store.initialize()` to activate the plugin and start communication with the app stores.
*   **Why:** This is the final step to make the plugin operational. It loads product details and existing purchases.

Add the initialization call at the end of `initializeStore`:

```javascript
// Inside initializeStore()

// 4. Initialize the Store
console.log('Initializing store...');
store.initialize([store.defaultPlatform()]) // Initialize only the default platform for this example
    .then(() => {
        console.log("Store initialized successfully");
        // Now that the store is initialized, try to refresh the UI
        // with any products that might have been loaded synchronously (unlikely but safe)
        const product = store.get('nonconsumable1'); // Use your product ID
        if (product) refreshProductUI(product);
        refreshFeatureUI(); // Ensure feature status is checked after init
    })
    .catch(err => {
        console.error("Store initialization failed", err);
        setState({ error: 'Failed to initialize store.', status: 'Error' });
    });
```

**Step 7: Implement UI Updates - Feature Status**

*   **What:** Fill in the `refreshFeatureUI` function to check your application's way of storing the "unlocked" status (here, `localStorage`) and update the corresponding HTML element.
*   **Why:** To show the user whether they have already purchased and unlocked the feature.

Replace the placeholder `refreshFeatureUI` function with this:

```javascript
// In js/index.js

function refreshFeatureUI() {
    console.log('Refreshing feature UI...');
    // Check localStorage (or your preferred storage) for unlock status
    const isUnlocked = window.localStorage.getItem(FEATURE_KEY) === 'YES';
    const statusEl = document.getElementById('feature-status');
    if (statusEl) {
        statusEl.textContent = 'Feature Status: ' + (isUnlocked ? 'UNLOCKED! 🎉' : 'Locked');
        console.log('Feature is ' + (isUnlocked ? 'Unlocked' : 'Locked'));
    } else {
        console.warn('feature-status element not found');
    }

    // It's also good practice to refresh the product UI in case ownership changed `canPurchase`
    const product = CdvPurchase.store.get('nonconsumable1'); // Use your product ID
    if (product) refreshProductUI(product);
}
```

**Step 8: Implement UI Updates - Product Details & Button**

*   **What:** Fill in the `refreshProductUI` function. It receives a `Product` object when the `productUpdated` event fires. Use its properties (`title`, `description`, `pricing`, `canPurchase`) to populate the product details section and decide whether to show the purchase button.
*   **Why:** To display accurate information fetched from the app store and provide a purchase option only when appropriate (product loaded, feature not already unlocked).

Replace the placeholder `refreshProductUI` function with this:

```javascript
// In js/index.js

function refreshProductUI(product) {
    console.log('Refreshing product UI for: ' + (product ? product.id : 'null product'));
    const isUnlocked = window.localStorage.getItem(FEATURE_KEY) === 'YES';
    const el = document.getElementById('nonconsumable1-purchase'); // Use the ID from your HTML
    if (!el) {
        console.warn('nonconsumable1-purchase element not found');
        return;
    }

    let infoHtml = '';
    let buttonHtml = '';

    if (product && product.title && product.pricing) { // Check if essential data is loaded
        console.log(`Product ${product.id} loaded: Title=${product.title}, Price=${product.pricing.price}`);
        infoHtml = `
            <p>
              ${product.description}<br/>
              <strong>Price: ${product.pricing.price}</strong>
            </p>`;

        if (isUnlocked) {
            buttonHtml = '<p><em>Feature already unlocked!</em></p>';
        } else if (product.canPurchase) {
            console.log(`Product ${product.id} can be purchased.`);
            // Ensure purchaseFeature function exists globally or is accessible
            // We'll define window.purchaseFeature in the next step.
            buttonHtml = '<button onclick="window.purchaseFeature()">Unlock Now!</button>';
        } else {
            console.log(`Product ${product.id} cannot be purchased (State: ${product.state}, Owned: ${product.owned}).`);
            // Might be owned based on local receipt, or in a non-purchasable state
            buttonHtml = '<p><em>(Cannot purchase at this time)</em></p>';
        }
    } else if (product) {
        // Product object exists but data isn't fully loaded yet
        infoHtml = `<p>Loading details for ${product.id}...</p>`;
        console.log(`Product ${product.id} exists but details not fully loaded yet.`);
    } else {
        // Product wasn't found after initialization
        infoHtml = '<p>Unlock feature not available.</p>';
        console.log('Product nonconsumable1 not found in store.');
    }

    // Update the content of the specific product's div
    el.innerHTML = `<h2>${product?.title ?? 'Unlock Feature'}</h2>${infoHtml}${buttonHtml}`;
}
```

**Step 9: Prepare the Purchase Function Stub**

*   **What:** Define the global function `window.purchaseFeature` that the "Unlock Now!" button calls. For now, it will just log a message.
*   **Why:** The button needs a function to call. Making it global (`window.purchaseFeature`) is a simple way to ensure it's accessible from the `onclick` attribute generated in the previous step. The actual purchase logic (`store.order()`) will be added later in the platform-specific guides.

```javascript
// In js/index.js (add this function definition)

// Make this function globally accessible for the button's onclick
window.purchaseFeature = function() {
    const productId = 'nonconsumable1'; // Use your product ID
    console.log(`Purchase button clicked for ${productId}`);
    const { store } = CdvPurchase;
    const product = store.get(productId);
    const offer = product?.getOffer(); // Get the default offer for the product

    if (offer) {
        console.log(`Attempting to order offer: ${offer.id} for product ${productId}`);
        alert('Purchase logic to be added in platform-specific guide (iOS/Android).');

        // --- Placeholder for the next step ---
        // The actual store.order() call will go here in the next section
        // store.order(offer).then(...);
        // -------------------------------------

    } else {
        console.error(`Cannot purchase feature: Product (${productId}) or its offer not found or not loaded yet.`);
        alert('Unable to purchase. Product details might still be loading.');
    }
}
```

---

Now you have the generic initialization and UI presentation logic set up. The application will:
1.  Wait for the device.
2.  Initialize the store plugin.
3.  Register your non-consumable product.
4.  Attempt to load product details from the store.
5.  Display the feature's locked/unlocked status based on `localStorage`.
6.  Display the product details and a purchase button (if applicable and not already unlocked).
7.  Prepare a function to be called when the button is pressed.

The next step is to add the platform-specific purchase handling (iOS or Android) which involves adding `.approved()`, `.verified()`, `.finished()` listeners and implementing the `store.order()` call within `window.purchaseFeature`.