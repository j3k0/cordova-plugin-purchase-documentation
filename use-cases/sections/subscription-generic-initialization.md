### Initialization & UI Setup (Subscriptions)

This section guides you through setting up the initial HTML and JavaScript required to initialize the purchase plugin, register your subscription products, configure a validator (essential for subscriptions), and display product information and subscription status before handling the actual purchase flow.

**Step 1: Basic HTML Structure**

*   **What:** Set up `www/index.html` with placeholders for subscription status, the list of available subscription products, error messages, and management buttons.
*   **Why:** Provides the necessary structure to display dynamic information about subscriptions to the user.

```markup
<!-- www/index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://validator.iaptic.com 'unsafe-eval' 'unsafe-inline' gap:; style-src 'self' 'unsafe-inline'; media-src *">
  <!-- IMPORTANT: Replace https://validator.iaptic.com with YOUR actual validator host -->
</head>
<body style="margin-top: 50px">
  <div class="app">
    <h1>Subscription Service</h1>
    <p id="subscription-status">Subscription Status: Loading...</p>
    <hr/>
    <h2>Available Plans</h2>
    <div id="subscription-products">
      <p>Loading subscription plans...</p>
    </div>
    <hr/>
    <div id="management-buttons">
      <!-- Buttons like Restore, Manage will go here -->
    </div>
    <!-- Placeholder for error messages -->
    <div id="error-display" style="color: red; margin-top: 10px;"></div>
  </div>
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
</html>
```

*   **Important:** Update the `Content-Security-Policy` meta tag to allow connections to your receipt validation server. Replace `https://validator.iaptic.com` if you use a different service or host your own. Add `'unsafe-inline'` if using `onclick`.

**Step 2: Initial JavaScript Framework**

*   **What:** Create `www/js/index.js` with the basic structure, waiting for `deviceready`.
*   **Why:** Ensures the plugin is loaded before we attempt to use it.

```javascript
// www/js/index.js

// Wait for Cordova to be ready
document.addEventListener('deviceready', initializeStore);

// Basic state holder (optional, but helps manage UI updates)
let appState = {
  products: [], // Will hold loaded CdvPurchase.Product objects
  activeSubscription: null, // Will hold the active CdvPurchase.VerifiedPurchase object
  status: 'Loading...',
  error: '',
};

// Helper function to update state and trigger UI refresh
function setState(update) {
  Object.assign(appState, update);
  renderUI(); // We'll define renderUI soon
}

function initializeStore() {
    console.log('Device is ready, initializing store for subscriptions...');

    if (!window.CdvPurchase || !window.CdvPurchase.store) {
        console.error('Store plugin not available');
        setState({ error: 'Store plugin failed to load.', status: 'Setup Error' });
        return;
    }

    const { store, ProductType, Platform, LogLevel } = CdvPurchase;
    console.log('Store plugin version: ' + store.version);

    // Optional: Set log level for debugging
    store.verbosity = LogLevel.DEBUG;

    // --- We will add subsequent steps here ---
    // 1. Register Products
    // 2. Configure Validator (Essential for Subscriptions)
    // 3. Setup Error Handling
    // 4. Setup Event Listeners
    // 5. Initialize the Store
}

// --- UI Rendering Function ---
function renderUI() {
    console.log('Rendering UI with current state:', appState);
    // (Implementation in Step 6)
}

// --- Action Functions (stubs for now) ---
// window.subscribe = function(productId, platform, offerId) { ... };
// window.restoreSubs = function() { ... };
```

**Step 3: Register Subscription Products**

*   **What:** Tell the plugin about your subscription products using `store.register()`. Specify `ProductType.PAID_SUBSCRIPTION`.
*   **Why:** The plugin needs to know which products to manage and fetch details for. Use the optional `group` property if you have different subscription tiers (e.g., 'bronze', 'gold') to enable platform-managed upgrades/downgrades where supported.

Add this inside `initializeStore`:

```javascript
// Inside initializeStore()

// 1. Register Products
console.log('Registering subscription products...');
// Replace with your actual product IDs and platforms
store.register([{
    id: 'subscription1', // e.g., 'myapp.monthly.premium'
    type: ProductType.PAID_SUBSCRIPTION,
    platform: store.defaultPlatform(), // Or specific platform like Platform.GOOGLE_PLAY
    group: 'premium' // Optional: Group subscriptions for upgrade/downgrade paths
}, {
    id: 'subscription2', // e.g., 'myapp.yearly.premium'
    type: ProductType.PAID_SUBSCRIPTION,
    platform: store.defaultPlatform(),
    group: 'premium' // Same group as the monthly one
}]);
```

**Step 4: Configure the Validator (Crucial for Subscriptions)**

*   **What:** Set the `store.validator` property to your receipt validation service URL or function.
*   **Why:** Subscriptions require server-side validation to accurately track expiry dates, renewal status, cancellations, grace periods, etc. Local device receipts are often insufficient or unreliable for this. **Do not skip this step for subscriptions.**

Add this inside `initializeStore`:

```javascript
// Inside initializeStore()

// 2. Configure Validator (Essential for Subscriptions)
console.log('Configuring validator...');
// Replace with your actual validation URL (e.g., from Iaptic or your own server)
store.validator = "https://validator.iaptic.com/v1/validate?appName=YOUR_APP&apiKey=YOUR_KEY";
if (store.validator.includes("YOUR_APP")) {
  const msg = "VALIDATOR NOT CONFIGURED. Replace YOUR_APP and YOUR_KEY in js/index.js.";
  console.warn(msg);
  setState({ error: msg, status: 'Setup Error' });
  // Consider preventing further actions if validator isn't set up
  // return;
}
```

**Step 5: Setup Error Handling**

*   **What:** Use `store.error()` to catch general plugin errors.
*   **Why:** Provides essential feedback for debugging and user information.

Add this inside `initializeStore`:

```javascript
// Inside initializeStore()

// 3. Setup Error Handling
console.log('Setting up error handler...');
store.error(function(error) {
    console.error('STORE ERROR ' + error.code + ': ' + error.message);
    setState({ error: `Error: ${error.message} (Code: ${error.code})` });
    // Optionally clear the error after a delay
    setTimeout(() => { if (appState.error === `Error: ${error.message} (Code: ${error.code})`) setState({ error: '' }); }, 10000);
});
```

**Step 6: Implement UI Rendering (`renderUI`)**

*   **What:** Create the `renderUI` function. It should display the overall subscription status (derived from verified purchases) and the details of each available subscription product, including a "Subscribe" button if appropriate.
*   **Why:** Shows the user their current status and available options.

Replace the placeholder `renderUI` function with this:

```javascript
// In js/index.js

function renderUI() {
    console.log('Rendering UI with current state:', appState);
    const { store, ProductType, Platform, RecurrenceMode, PaymentMode, Utils } = CdvPurchase; // Import necessary types/enums

    const statusEl = document.getElementById('subscription-status');
    const productsEl = document.getElementById('subscription-products');
    const errorEl = document.getElementById('error-display');
    const managementEl = document.getElementById('management-buttons');

    if (!statusEl || !productsEl || !errorEl || !managementEl) {
        console.error("Required UI elements not found!");
        return;
    }

    // Display Error
    errorEl.textContent = appState.error || '';

    // Determine Active Subscription Status from *verified* receipts
    // This requires a validator. Without it, this logic needs adjustment.
    const activeSub = store.verifiedPurchases.find(p => {
        const product = store.get(p.id, p.platform);
        // Check if it's a subscription type AND not expired
        return product?.type === ProductType.PAID_SUBSCRIPTION && !p.isExpired;
    });
    appState.activeSubscription = activeSub; // Store for potential reuse

    let statusMessage = 'Not Subscribed';
    if (activeSub) {
        const expiry = activeSub.expiryDate ? new Date(activeSub.expiryDate).toLocaleDateString() : 'N/A';
        const productName = store.get(activeSub.id, activeSub.platform)?.title ?? activeSub.id;
        statusMessage = `Subscribed to ${productName} (Expires: ${expiry})`;
        if (activeSub.renewalIntent === 'Lapse') statusMessage += ' - Will Not Renew';
        if (activeSub.isTrialPeriod) statusMessage += ' (Trial)';
        if (activeSub.isBillingRetryPeriod) statusMessage += ' (Billing Issue!)';
    } else {
        // Check for the latest expired subscription to inform the user
        const latestExpired = store.verifiedPurchases
            .filter(p => store.get(p.id, p.platform)?.type === ProductType.PAID_SUBSCRIPTION && p.isExpired)
            .sort((a, b) => (b.expiryDate ?? 0) - (a.expiryDate ?? 0))[0]; // Get the most recently expired
        if (latestExpired) {
            const expiry = latestExpired.expiryDate ? new Date(latestExpired.expiryDate).toLocaleDateString() : 'N/A';
            statusMessage = `Subscription expired on ${expiry}. Please resubscribe.`;
        }
    }
    statusEl.textContent = `Subscription Status: ${statusMessage}`;

    // Render Subscription Products
    productsEl.innerHTML = store.products
        .filter(p => p.type === ProductType.PAID_SUBSCRIPTION) // Show only subscriptions
        .map(product => {
            let productHtml = `<div><h4>${product.title || product.id}</h4>`;
            if (product.description) productHtml += `<p>${product.description}</p>`;

            if (product.offers && product.offers.length > 0) {
                product.offers.forEach(offer => {
                    productHtml += `<div style="margin-left: 10px; border-left: 2px solid #ccc; padding-left: 10px;">`;
                    const priceDetails = offer.pricingPhases.map(phase => {
                        let phaseDesc = `${phase.price}`;
                        if (phase.billingPeriod) {
                           phaseDesc += ` / ${Utils.formatDurationEN(phase.billingPeriod, { omitOne: true })}`;
                        }
                        if (phase.paymentMode === PaymentMode.FREE_TRIAL) {
                            phaseDesc = `Free Trial for ${Utils.formatDurationEN(phase.billingPeriod)}`;
                        } else if (phase.paymentMode === PaymentMode.PAY_AS_YOU_GO && phase.recurrenceMode === RecurrenceMode.FINITE_RECURRING) {
                            phaseDesc += ` (for ${phase.billingCycles} cycles)`;
                        } else if (phase.paymentMode === PaymentMode.UP_FRONT && phase.billingPeriod) {
                             phaseDesc = `${phase.price} for ${Utils.formatDurationEN(phase.billingPeriod)}`;
                        }
                        return phaseDesc;
                    }).join(' then ');

                    productHtml += `<p><strong>Offer:</strong> ${priceDetails}</p>`;

                    // Button logic:
                    // Show "Subscribe" only if:
                    // 1. There's no active subscription at all OR
                    // 2. There IS an active subscription, BUT it's NOT for this product AND they are in the same group (upgrade/downgrade)
                    // 3. The offer can actually be purchased
                    const isCurrentActiveSub = activeSub && activeSub.id === product.id && activeSub.platform === product.platform;
                    const canUpgradeDowngrade = activeSub && !isCurrentActiveSub && product.group && store.get(activeSub.id, activeSub.platform)?.group === product.group;

                    if ((!activeSub || canUpgradeDowngrade) && offer.canPurchase) {
                        const buttonLabel = canUpgradeDowngrade ? 'Switch Plan' : 'Subscribe';
                        productHtml += `<button onclick="window.subscribe('${product.id}', '${product.platform}', '${offer.id}')">${buttonLabel}</button>`;
                    } else if (isCurrentActiveSub) {
                        productHtml += '<p><em>(Currently Active)</em></p>';
                    } else {
                        productHtml += '<p><em>(Cannot purchase)</em></p>';
                    }
                    productHtml += `</div>`; // Close offer div
                });
            } else {
                productHtml += '<p>Pricing information not available.</p>';
            }
            productHtml += `</div>`; // Close product div
            return productHtml;
        }).join('<hr/>');

    // Render Management Buttons
    managementEl.innerHTML = ''; // Clear previous
    const currentPlatform = activeSub?.platform ?? store.defaultPlatform();
    if (store.checkSupport(currentPlatform, 'manageSubscriptions')) {
        managementEl.innerHTML += `<button onclick="CdvPurchase.store.manageSubscriptions('${currentPlatform}')">Manage Subscription</button> `;
    }
    if (store.checkSupport(currentPlatform, 'manageBilling')) {
        managementEl.innerHTML += `<button onclick="CdvPurchase.store.manageBilling('${currentPlatform}')">Manage Billing</button> `;
    }
    if (store.checkSupport(currentPlatform, 'restorePurchases')) {
         managementEl.innerHTML += `<button onclick="window.restoreSubs()">Restore Purchases</button>`;
    }
}
```

**Step 7: Setup Event Listeners**

*   **What:** Listen for product and receipt updates using `store.when()`.
*   **Why:** To keep the UI synchronized with the latest data fetched from the stores and the validator.

Add this inside `initializeStore`:

```javascript
// Inside initializeStore()

// 4. Setup Event Listeners
console.log('Setting up event listeners...');
store.when()
    .productUpdated(product => {
        console.log("Product updated: " + product.id);
        // Find and update the product in our local state (appState.products)
        const index = appState.products.findIndex(p => p.id === product.id && p.platform === product.platform);
        if (index >= 0) appState.products[index] = product;
        else appState.products.push(product);
        renderUI(); // Refresh the whole UI
    })
    .receiptUpdated(() => {
        console.log("Receipt updated (local)");
        // Re-render to potentially update purchase/owned status based on local data
        renderUI();
    })
    .verified(() => {
        console.log("Receipt verified");
        // Re-render to update purchase/owned status based on verified data
        renderUI();
    });
    // We will add .approved() and .finished() handlers in the platform-specific
    // purchase flow sections.
```

**Step 8: Initialize the Store**

*   **What:** Call `store.initialize()` to start the plugin.
*   **Why:** Activates the registered platforms and begins loading product/purchase data.

Add this at the *end* of `initializeStore`:

```javascript
// Inside initializeStore()

// 5. Initialize the Store
console.log('Initializing store plugin...');
store.initialize([store.defaultPlatform()]) // Add other platforms if needed
    .then(() => {
        console.log("Store initialized successfully.");
        // Initial UI render after initialization attempt
        renderUI();
    })
    .catch(err => {
        console.error("Store initialization failed", err);
        setState({ error: 'Failed to initialize store.', status: 'Error' });
    });
```

**Step 9: Prepare Action Function Stubs**

*   **What:** Define the global functions (`window.subscribe`, `window.restoreSubs`) that the UI buttons will call.
*   **Why:** Provides the necessary functions for the `onclick` handlers. The actual logic will be implemented in the platform-specific purchase flow guides.

```javascript
// In js/index.js (add these function definitions)

// Make functions globally accessible for button onclick handlers
window.subscribe = function(productId, platform, offerId) {
    console.log(`Subscribe button clicked for ${productId} on ${platform}, offer ${offerId}`);
    const { store } = CdvPurchase;
    const offer = store.get(productId, platform)?.getOffer(offerId);

    if (offer) {
        console.log(`Attempting to order offer: ${offer.id}`);
        alert('Subscription purchase logic (store.order) goes here!');
        // --- Placeholder for the next step ---
        // store.order(offer, { applicationUsername: 'user123' }) // Example
        // .then(result => { ... });
        // -------------------------------------
    } else {
        console.error(`Cannot subscribe: Product (${productId}) or Offer (${offerId}) not found or not loaded yet.`);
        alert('Unable to subscribe. Product details might still be loading.');
    }
}

window.restoreSubs = function() {
    console.log('Restore button clicked');
    const { store } = CdvPurchase;
    console.log('Initiating restore purchases...');
    setState({ status: 'Restoring purchases...' }); // Update UI
    store.restorePurchases().then((result) => {
        console.log('Restore attempt finished.');
        if (result && result.isError) {
             console.error("Restore failed: " + result.message);
             alert("Failed to restore purchases: " + result.message);
             setState({ error: result.message });
        } else {
             console.log("Restore successful (check receiptUpdated/verified events for updates)");
             alert("Restore attempt complete. Your subscriptions should update shortly.");
        }
        renderUI(); // Refresh UI after attempt
    });
}
```

---

This sets up the generic part for handling subscriptions. The UI will now display product information and subscription status based on *verified* data (once available). The next steps involve implementing the purchase flow (`store.order` call within `window.subscribe`, and the `.approved()`, `.verified()`, `.finished()` handlers) specific to either the App Store or Google Play.