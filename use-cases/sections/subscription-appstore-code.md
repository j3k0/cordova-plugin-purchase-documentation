## Code Implementation

This section details the minimal code required to implement a subscription product on iOS and macOS using the AppStore platform.

### Base framework

First, let's set up the basic HTML structure and the initial JavaScript to load the plugin.

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
7.  **Placeholders (Lines 54-72):** Empty definitions for `initializeStoreAndSetupListeners` and `refreshUI` emphasize that their specific logic depends on the use case and will be provided in subsequent steps of the tutorials.

This minimal base ensures the plugin is loaded and basic logging/error handling is in place before diving into platform-specific or product-type-specific configurations in the main use-case guides.

### Initialization & Presentation

Now, we'll initialize the plugin, register our subscription products, and set up the UI to display their status and purchase options. This involves:
*   Registering products with type `PAID_SUBSCRIPTION`.
*   Setting up a receipt validator (required for reliable subscription handling).
*   Displaying product details (title, description, price, expiry).
*   Showing a "Subscribe" button only when the product `canPurchase`.

This section guides you through setting up the initial HTML and JavaScript required to initialize the purchase plugin for **subscriptions**, register your subscription products, configure a validator (essential for subscriptions), and display product information and subscription status. The actual purchase flow logic is deferred to platform-specific guides.

**Assumptions:**

*   You have completed the [basic JavaScript setup](code-initial-javascript.md).
*   You have created subscription products (and potentially subscription groups) in your target platform's developer console.

**Step 1: Update HTML Structure**

Ensure your `www/index.html` includes placeholders for subscription status, product details, and management buttons.

```html
<!-- www/index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://your-validator.com 'unsafe-eval' 'unsafe-inline' gap:; style-src 'self' 'unsafe-inline'; media-src *">
  <!-- IMPORTANT: Replace https://your-validator.com with YOUR actual validator host -->
  <title>Subscription Demo</title>
  <style> /* Basic styles */ </style>
</head>
<body style="margin-top: 20px; padding: 10px;">
  <div class="app">
    <h1>Subscription Service</h1>
    <!-- Status messages -->
    <div id="messages" style="font-style: italic; color: #555; margin-bottom: 10px;">Loading...</div>
    <hr/>
    <!-- Subscription Status -->
    <div id="user-status"><b>Subscription Status:</b> Loading...</div>
    <hr/>
    <h2>Available Plans</h2>
    <!-- Product List -->
    <div id="product-details">
      <p>Loading subscription plans...</p>
    </div>
    <hr/>
    <!-- Management Buttons -->
    <div id="management-buttons"></div>
  </div>
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
</html>
```
*   **Explanation:** We use `#user-status` for the overall subscription status, `#product-details` for the list of plans, and `#management-buttons` for actions like "Restore" or "Manage". Update the `Content-Security-Policy` to allow connections to your validator.

**Step 2: Implement `initializeStoreAndSetupListeners` for Subscriptions**

Replace the placeholder `initializeStoreAndSetupListeners` function with the following code. This version registers subscription products, **mandates validator setup**, listens for relevant events, and initializes the store.

{% code title="www/js/index.js (initializeStoreAndSetupListeners)" lineNumbers="true" %}
```javascript
// This function should be called by onDeviceReady after basic setup
function initializeStoreAndSetupListeners() {
  console.log('Setting up store for Subscriptions...');
  setStatus('Initializing Store for Subscriptions...');

  const { store, ProductType, Platform, LogLevel, Utils } = CdvPurchase;

  // --- Product Definitions ---
  // Define your subscription product IDs and groups.
  // Replace these with your actual IDs configured in the App/Play Store.
  const MY_MONTHLY_SUB_ID = 'subscription_monthly';
  const MY_YEARLY_SUB_ID = 'subscription_yearly';
  const MY_SUBSCRIPTION_GROUP = 'premium_access'; // Group allows upgrades/downgrades

  // --- Register Products ---
  store.register([{
    id: MY_MONTHLY_SUB_ID,
    type: ProductType.PAID_SUBSCRIPTION,
    platform: store.defaultPlatform(),
    group: MY_SUBSCRIPTION_GROUP
  }, {
    id: MY_YEARLY_SUB_ID,
    type: ProductType.PAID_SUBSCRIPTION,
    platform: store.defaultPlatform(),
    group: MY_SUBSCRIPTION_GROUP
  }]);

  // --- Setup Receipt Validator (MANDATORY for Subscriptions) ---
  // Subscriptions REQUIRE server-side validation for reliable status tracking.
  // Replace with your actual validator URL or function.
  store.validator = "https://your-validator.com/validate"; // Example URL
  // store.validator = new CdvPurchase.Iaptic({...}).validator; // Example using Iaptic helper
  if (!store.validator || store.validator.includes("your-validator.com")) {
    const msg = "VALIDATOR NOT CONFIGURED. Subscriptions require server-side validation.";
    console.error(msg);
    setStatus('ERROR: ' + msg);
    // It's strongly recommended to halt or clearly warn the user if the validator isn't set up.
    // return;
  }

  // --- Setup Event Listeners ---
  store.when()
    .productUpdated(product => {
      // Update UI when product details like price change.
      console.log('Product updated: ' + product.id);
      refreshUI();
    })
    .receiptUpdated(receipt => {
      // Local receipt changes. Refresh UI, but rely on 'verified' for definitive status.
      console.log('Local receipt updated.');
      refreshUI();
    })
    .verified(receipt => {
      // Receipt validated with the server. This is the source of truth for subscription status.
      console.log('Receipt verified.');
      refreshUI(); // Refresh UI based on the latest verified data
    })
    // Purchase flow listeners (.approved, .finished, .cancelled)
    // will be added in the platform-specific purchase flow sections.
    ; // End of store.when() chain

  // --- Initialize the Store ---
  // Initialize the platform(s) for your subscriptions.
  store.initialize([store.defaultPlatform()])
    .then(() => {
      console.log('Store initialized successfully.');
      setStatus('Store ready.');
      refreshUI(); // Render the UI with initial data
    })
    .catch(err => {
      console.error('Store initialization failed:', err);
      setStatus('Store failed to initialize.');
    });
}

// --- UI Rendering ---

// This function updates the UI based on product data and verified subscription status
function refreshUI() {
  console.log('Refreshing Subscription UI...');
  const { store, ProductType, Platform, RecurrenceMode, PaymentMode, Utils, RenewalIntent } = CdvPurchase;

  const statusEl = document.getElementById('user-status'); // Target subscription status display
  const productsEl = document.getElementById('product-details'); // Target product list display
  const managementEl = document.getElementById('management-buttons'); // Target management buttons area

  if (!statusEl || !productsEl || !managementEl) {
    console.error("Required UI elements not found!");
    return;
  }

  // --- Determine Active Subscription Status ---
  // Find the latest, active, verified subscription purchase.
  const activeSub = store.verifiedPurchases
    .filter(p => store.get(p.id)?.type === ProductType.PAID_SUBSCRIPTION && !p.isExpired)
    .sort((a, b) => (b.purchaseDate ?? 0) - (a.purchaseDate ?? 0))[0]; // Get the most recent active one

  let statusMessage = 'Subscription: Inactive';
  if (activeSub) {
    const expiry = activeSub.expiryDate ? new Date(activeSub.expiryDate).toLocaleDateString() : 'N/A';
    const productName = store.get(activeSub.id, activeSub.platform)?.title ?? activeSub.id;
    statusMessage = `Subscription: ACTIVE (${productName})`;
    statusMessage += ` - Expires: ${expiry}`;
    if (activeSub.renewalIntent === RenewalIntent.LAPSE) statusMessage += ' <span style="color:orange;">[Will Not Renew]</span>';
    if (activeSub.isTrialPeriod) statusMessage += ' (Trial)';
    if (activeSub.isBillingRetryPeriod) statusMessage += ' <span style="color:red;">[Billing Issue!]</span>';
    // Unlock premium features based on activeSub
  } else {
    // Lock premium features
    // Optionally check for expired subs to show a message
    const latestExpired = store.verifiedPurchases
        .filter(p => store.get(p.id)?.type === ProductType.PAID_SUBSCRIPTION && p.isExpired)
        .sort((a, b) => (b.expiryDate ?? 0) - (a.expiryDate ?? 0))[0];
    if (latestExpired) {
        const expiry = latestExpired.expiryDate ? new Date(latestExpired.expiryDate).toLocaleDateString() : 'N/A';
        statusMessage = `Subscription: Expired on ${expiry}. Please resubscribe.`;
    }
  }
  statusEl.innerHTML = statusMessage; // Use innerHTML for potential styling

  // --- Render Subscription Products/Offers ---
  productsEl.innerHTML = store.products
    .filter(p => p.type === ProductType.PAID_SUBSCRIPTION) // Show only subscriptions
    .map(product => {
      let productHtml = `<div><h4>${product.title || product.id}</h4>`;
      if (product.description) productHtml += `<p>${product.description}</p>`;

      if (product.offers && product.offers.length > 0) {
        product.offers.forEach(offer => {
          productHtml += `<div style="margin-left: 10px; border-left: 2px solid #ccc; padding-left: 10px;">`;
          // Format pricing phases
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

          // --- Button Logic ---
          const isCurrentActiveSub = activeSub && activeSub.id === product.id && activeSub.platform === product.platform;
          const canUpgradeDowngrade = activeSub && !isCurrentActiveSub && product.group && store.get(activeSub.id, activeSub.platform)?.group === product.group;

          if (isCurrentActiveSub) {
            productHtml += '<p><em>(Currently Active)</em></p>';
          } else if ((!activeSub || canUpgradeDowngrade) && offer.canPurchase) {
            const buttonLabel = canUpgradeDowngrade ? 'Switch Plan' : 'Subscribe';
            // The 'subscribe' function will be implemented in platform-specific guides
            productHtml += `<button onclick="subscribe('${product.id}', '${product.platform}', '${offer.id}')">${buttonLabel}</button>`;
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

  // --- Render Management Buttons ---
  managementEl.innerHTML = ''; // Clear previous
  const currentPlatform = activeSub?.platform ?? store.defaultPlatform();
  if (store.checkSupport(currentPlatform, 'manageSubscriptions')) {
    managementEl.innerHTML += `<button onclick="CdvPurchase.store.manageSubscriptions('${currentPlatform}')">Manage Subscription</button> `;
  }
  if (store.checkSupport(currentPlatform, 'manageBilling')) {
    managementEl.innerHTML += `<button onclick="CdvPurchase.store.manageBilling('${currentPlatform}')">Manage Billing</button> `;
  }
  // Restore button might be useful even without an active sub
  if (store.checkSupport(currentPlatform, 'restorePurchases')) {
       managementEl.innerHTML += `<button onclick="restoreSubscriptions()">Restore Purchases</button>`;
  }
}

// --- Placeholder for Purchase Action ---
// This will be implemented in the platform-specific guides (subscription-*.md)
window.subscribe = function(productId, platform, offerId) {
  console.log(`Placeholder: subscribe(${productId}, ${platform}, ${offerId}) called.`);
  alert('Subscription purchase logic needs to be implemented for the specific platform.');
};

// --- Placeholder for Restore Action ---
// This will be implemented in the platform-specific guides
window.restoreSubscriptions = function() {
  console.log('Placeholder: restoreSubscriptions() called.');
  setStatus('Restoring purchases...');
  CdvPurchase.store.restorePurchases().then((result) => {
    setStatus(result ? `Restore failed: ${result.message}` : 'Restore attempt complete.');
    refreshUI();
  });
};

// Initial UI update on device ready
document.addEventListener('deviceready', () => {
  // Ensure the initial call to initializeStoreAndSetupListeners happens
  if (typeof initializeStoreAndSetupListeners === 'function') {
     // Already called by onDeviceReady in the initial script
  } else {
     initializeStoreAndSetupListeners = initializeStore;
     initializeStoreAndSetupListeners();
  }
  // Initial render based on potentially stored state or loading status
  refreshUI();
}, false);

// Ensure setStatus is defined
if (typeof setStatus !== 'function') {
  setStatus = (message) => console.log('[Status] ' + message);
}

// Helper to format ISO durations (ensure this is included, e.g., from initial setup)
if (!CdvPurchase.Utils) CdvPurchase.Utils = {};
if (!CdvPurchase.Utils.formatDurationEN) {
    CdvPurchase.Utils.formatDurationEN = function(iso, options) {
      if (!iso) return '';
      const l = iso.length;
      const n = iso.slice(1, l - 1);
      if (n === '1') {
        return options?.omitOne ?
          ({ 'D': 'day', 'W': 'week', 'M': 'month', 'Y': 'year' }[iso[l - 1]]) || iso[l - 1]
          : ({ 'D': '1 day', 'W': '1 week', 'M': '1 month', 'Y': '1 year' }[iso[l - 1]]) || iso[l - 1];
      } else {
        const u = ({ 'D': 'days', 'W': 'weeks', 'M': 'months', 'Y': 'years' }[iso[l - 1]]) || iso[l - 1];
        return `${n} ${u}`;
      }
    }
}

```
{% endcode %}

**Explanation:**

1.  **Product Definitions (Lines 9-13):** Define IDs for your subscription products and optionally assign them to a `group` for handling upgrades/downgrades.
2.  **Register Products (Lines 16-27):** Call `store.register()` with the `id`, `type` set to `ProductType.PAID_SUBSCRIPTION`, the `platform`, and the `group`.
3.  **Validator Setup (Lines 30-38):** **Crucially**, set `store.validator` to your validation service URL. Subscriptions *require* server-side validation for reliable status tracking (expiry, renewals, cancellations). A warning is logged if it seems unconfigured.
4.  **Event Listeners (Lines 41-58):**
    *   `productUpdated`: Refreshes the UI when product details load.
    *   `receiptUpdated`: Refreshes the UI when local receipt data changes.
    *   `verified`: **This is the most important listener for subscriptions.** It fires after successful validation. The `refreshUI` function should rely on the data within `store.verifiedReceipts` (updated internally after this event) to determine the true subscription status.
    *   Purchase flow listeners (`approved`, `finished`, etc.) are deferred.
5.  **Initialize Store (Lines 61-70):** Call `store.initialize()` to activate the platform.
6.  **UI Rendering (`refreshUI` - Lines 74-151):**
    *   This function is key for displaying subscription status accurately.
    *   It finds the **active subscription** by looking through `store.verifiedPurchases` (populated from validated receipts) for a non-expired, paid subscription.
    *   It displays the status ("ACTIVE", "Inactive", "Expired"), the product name, expiry date, and potential issues like `renewalIntent` (will it lapse?) or `isBillingRetryPeriod`.
    *   It renders the available subscription products/offers, showing pricing details (including formatted billing periods and trial info using `Utils.formatDurationEN`).
    *   The "Subscribe" or "Switch Plan" button logic checks if there's an active subscription, if the current offer is for a different product within the same `group` (allowing upgrade/downgrade), and if the offer `canPurchase`.
    *   It renders "Manage Subscription" and "Manage Billing" buttons using `store.checkSupport()`.
7.  **Placeholders (Lines 154-168):** Empty functions `subscribe` and `restoreSubscriptions` are defined for later implementation.
8.  **Initial Load & Helpers (Lines 171-end):** Ensures initialization runs and includes the `formatDurationEN` helper if not already present.

This setup prepares your app to display subscription products and their status based on **validated receipt data**. The next steps involve implementing the platform-specific purchase flow (`subscribe` function and the `.approved`, `.verified`, `.finished` listeners).

### Purchase Flow

Finally, we need to handle the purchase events triggered when the user initiates a subscription purchase. This typically involves:
*   Initiating the order when the "Subscribe" button is clicked.
*   Verifying the transaction with the receipt validator upon approval.
*   Finishing the transaction once verified to grant access.

### Purchase Flow (iOS/App Store Subscription)

This section details the purchase logic for **auto-renewing subscriptions** on **iOS/App Store**, assuming you have completed the [generic subscription initialization](subscription-generic-initialization.md). Handling subscriptions reliably requires verification and **acknowledgment** via `transaction.finish()`.

**Step 1: Implement the Subscription Purchase Action (`subscribe`)**

*   **What:** Replace the placeholder `window.subscribe` function (from the generic initialization) to call `offer.order()` specifically for the App Store platform.
*   **Why:** This initiates the subscription purchase flow via StoreKit when the user clicks the "Subscribe" or "Switch Plan" button.

Replace the placeholder `window.subscribe` function in `www/js/index.js`:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.subscribe = function(productId, platform, offerId) {
    console.log(`Subscribe button clicked for ${productId}, offer ${offerId} on ${platform}`);
    const { store, Platform, ProductType } = CdvPurchase;

    // Ensure we're acting on the correct platform
    if (platform !== Platform.APPLE_APPSTORE) {
        console.error("This function is currently specific to AppStore!");
        return;
    }

    const product = store.get(productId, Platform.APPLE_APPSTORE);
    const offer = product?.getOffer(offerId); // Get the specific offer

    if (offer) {
        console.log(`Initiating order for offer: ${offer.id} on platform ${offer.platform}`);
        setStatus('Initiating subscription...');

        // Optional: Pass applicationUsername for tracking/linking on your server
        // const additionalData = { applicationUsername: 'hashed_user_id_or_uuid' };
        // offer.order(additionalData)

        // Optional: Pass discount details if ordering a promotional offer
        // const discountData = { appStore: { discount: { id: 'promoId', key: '...', nonce: '...', signature: '...', timestamp: '...' } } };
        // offer.order(discountData)

        offer.order()
            .then(result => {
                // Promise resolves when the App Store sheet is dismissed.
                if (result && result.isError) {
                    setStatus(`Subscription failed: ${result.message}`);
                } else {
                    // Purchase flow started... status updated by listeners.
                }
                refreshUI();
            })
            .catch(err => {
                 console.error("Unexpected error during subscription order:", err);
                 setStatus('Unexpected error during subscription.');
                 refreshUI();
            });

    } else {
        console.error(`Cannot subscribe: Product (${productId}) or Offer (${offerId}) not found.`);
        setStatus('Error: Unable to subscribe. Product details missing.');
    }
}
```
*   **Explanation:**
    *   We retrieve the specific `offer` to purchase.
    *   `offer.order()` initiates the flow.
    *   `additionalData` can be used to pass `applicationUsername` or promotional offer `discount` details if needed.

**Step 2: Handle Purchase Events (`.approved`, `.verified`, `.finished`)**

*   **What:** Add the subscription purchase lifecycle event listeners within the `store.when()` chain in your `initializeStoreAndSetupListeners` function.
*   **Why:** These listeners handle the progression: approval by App Store, mandatory verification via your validator, and mandatory acknowledgment via `finish()`.

Add these handlers inside the existing `store.when()` call:

```javascript
// Inside initializeStoreAndSetupListeners() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);
        setStatus('Purchase approved. Verifying...');

        // Verification is REQUIRED for subscriptions to get accurate status from Apple's servers.
        if (store.validator) {
            transaction.verify(); // Initiate verification
        } else {
             console.error("VALIDATOR REQUIRED: Cannot reliably manage subscriptions without receipt validation.");
             setStatus("ERROR: Validator not configured.");
             // Do NOT finish the transaction here without validation.
        }
    })
    .verified(receipt => {
        console.log(`Receipt verified, contains ${receipt.collection.length} verified purchases.`);
        setStatus('Purchase verified. Finishing...');

        // The verified receipt contains the authoritative status from App Store Server API.
        // The refreshUI() function (called below) should use store.verifiedPurchases or store.owned()
        // to update the UI based on this validated data.

        // Finish (acknowledge) the transaction associated with this receipt with the App Store.
        // This is MANDATORY for subscriptions.
        console.log(`Finishing verified receipt's source transaction: ${receipt.sourceReceipt.transactions[0]?.transactionId}`);
        receipt.finish();
    })
    .finished(transaction => {
        // This confirms the finish() call was successful.
        console.log(`Transaction ${transaction.transactionId} finished for ${transaction.products[0]?.id}.`);
        setStatus('Subscription active!');
        // Subscription state should reflect verified data. Refresh UI to be sure.
        refreshUI();
    })
    .cancelled(transaction => {
        console.log('Purchase Cancelled:', transaction.transactionId);
        setStatus('Purchase cancelled.');
        refreshUI();
    });
    // Ensure the .productUpdated, .receiptUpdated listeners from the generic setup are still present
```
*   **Explanation:**
    *   `.approved()`: Triggers `transaction.verify()`. Validation is essential.
    *   `.verified()`: The receipt is validated. The UI should be updated based on this (`refreshUI()` is called). Crucially, `receipt.finish()` is called to acknowledge the purchase with the App Store.
    *   `.finished()`: Confirms acknowledgment. Update UI.

---

**Build and Test (iOS/App Store Subscription)**

Testing subscriptions follows the standard iOS procedure, paying attention to renewals and management:

1.  **Prepare & Build:**
    *   Save changes.
    *   Run `cordova prepare ios`.
    *   Open the project in Xcode (`open platforms/ios/*.xcworkspace` or `.xcodeproj`).
2.  **Configure & Run in Xcode:**
    *   Set up signing (Team, Certificates).
    *   Select your **physical test device**. Simulators are unreliable for IAP.
    *   **Validator:** Ensure `store.validator` is configured and your server has the correct **App-Specific Shared Secret**. See [Setup Guide - Step 7](sections/setup-subscription-ios-7-validation-server.md).
    *   **Sandbox Tester:** On the device, go to `Settings -> App Store`. Sign out of any production Apple ID. **Do not** sign in to the Sandbox account yet.
    *   Run the app from Xcode (▶).
3.  **Test Subscription Purchase:**
    *   Observe UI and Xcode console logs. Initial status should be "Subscription: Inactive". Product details should load.
    *   Tap the **"Subscribe"** button.
    *   The App Store purchase sheet appears. **Sign in** with your **Sandbox Tester** account when prompted.
    *   Confirm the subscription purchase (it will show "[Environment: Sandbox]").
    *   Observe logs: `approved`, `Verification required...`, `Receipt verified...`, `Finishing...`, `finished`.
    *   The UI (`refreshUI`) should update based on the `verified` event data, showing "Subscription: ACTIVE" with the expiry date from the validator.
4.  **Test Renewals (Sandbox):**
    *   Sandbox subscriptions renew quickly (e.g., a 1-month sub renews every ~5 minutes).
    *   Keep the app running or reopen it after the renewal time.
    *   Observe new `approved` -> `verified` -> `finished` cycles in the logs. The expiry date in the UI should update after verification.
5.  **Test Management:**
    *   Tap the "Manage Subscription" button (rendered by `refreshUI`).
    *   This opens the system's Sandbox subscription management UI. Test changing plans (if you have groups) or cancelling.
    *   After making changes, call `store.update()` or wait for the next renewal cycle; the changes should reflect in the `VerifiedPurchase` data after validation.

---

This completes the subscription purchase flow for iOS/App Store. Accurate status relies heavily on the configured receipt validator. Remember to call `transaction.finish()` after successful verification.
