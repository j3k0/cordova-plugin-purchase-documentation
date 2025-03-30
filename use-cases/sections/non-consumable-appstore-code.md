## Code Implementation

This section details the minimal code required to implement a non-consumable product (like unlocking a feature or removing ads) on iOS and macOS using the AppStore platform.

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

Now, we'll initialize the plugin, register our non-consumable product, and set up the UI to display its status and purchase options. This involves:
*   Registering the product with type `NON_CONSUMABLE`.
*   Displaying product details (title, description, price).
*   Showing a "Buy" or "Unlock" button only when the product `canPurchase`.
*   Reflecting the unlocked status in the UI (e.g., showing the premium feature or hiding ads).

This section covers the initial setup and UI display for a **non-consumable** product (like unlocking a premium feature or removing ads) using the `cordova-plugin-purchase` plugin (v13+). It focuses on registering the product and displaying its information based on ownership status, deferring the actual purchase logic to platform-specific guides.

**Assumptions:**

*   You have completed the [basic JavaScript setup](code-initial-javascript.md).
*   You have created a non-consumable product in your target platform's developer console.

**Step 1: Implement `initializeStoreAndSetupListeners`**

Replace the placeholder `initializeStoreAndSetupListeners` function with the following code. This registers your non-consumable product, sets up essential event listeners for UI updates, configures the (highly recommended) validator, and initializes the store.

{% code title="www/js/index.js (initializeStoreAndSetupListeners)" lineNumbers="true" %}
```javascript
// This function should be called by onDeviceReady after basic setup
function initializeStoreAndSetupListeners() {
  console.log('Setting up store for Non-Consumables...');
  setStatus('Initializing Store for Non-Consumables...');

  const { store, ProductType, Platform, LogLevel } = CdvPurchase;

  // --- Product Definition ---
  // Define the non-consumable product ID you configured in the App/Play Store.
  const MY_NON_CONSUMABLE_ID = 'unlock_premium_feature'; // Replace with your actual ID
  // Key used to store ownership status (use SecureStorage in production!)
  const FEATURE_KEY = 'isPremiumFeatureUnlocked';

  // --- Register Product ---
  store.register({
    id: MY_NON_CONSUMABLE_ID,
    type: ProductType.NON_CONSUMABLE,
    platform: store.defaultPlatform() // Or specify Platform.GOOGLE_PLAY, Platform.APPLE_APPSTORE
  });

  // --- Setup Receipt Validator (Highly Recommended) ---
  // Essential for security and restoring purchases reliably.
  // store.validator = "https://your-validator.com/validate";
  // store.validator = new CdvPurchase.Iaptic({...}).validator;

  // --- Setup Event Listeners ---
  store.when()
    .productUpdated(product => {
      console.log('Product updated: ' + product.id);
      if (product.id === MY_NON_CONSUMABLE_ID) {
        // myProductReference = product; // Store if needed globally
      }
      refreshUI(); // Update the UI with product details & ownership status
    })
    .receiptUpdated(receipt => {
      // Local receipt changes might affect 'owned' status if no validator is used.
      // Refresh UI to reflect potential changes.
      console.log('Local receipt updated.');
      refreshUI();
    })
    .verified(receipt => {
      // Verified receipt is the source of truth for ownership.
      console.log('Receipt verified.');
      refreshUI(); // Refresh UI based on verified data
    })
    // Purchase flow listeners (.approved, .finished, .cancelled)
    // will be added in the platform-specific purchase flow sections.
    ; // End of store.when() chain

  // --- Initialize the Store ---
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

// Function to check if the feature is unlocked (reads from storage)
function isFeatureUnlocked() {
  // WARNING: localStorage is INSECURE. Use SecureStorage plugin or server check.
  try {
    return window.localStorage.getItem(FEATURE_KEY) === 'YES';
  } catch (e) {
    console.error('Error reading from localStorage:', e);
    return false;
  }
}

// This function updates the UI based on product data and ownership status
function refreshUI() {
  console.log('Refreshing UI...');
  const { store, Platform } = CdvPurchase;

  const product = store.get(MY_NON_CONSUMABLE_ID);
  const productEl = document.getElementById('product-details');
  const statusEl = document.getElementById('user-status'); // Target the status display area

  // Determine ownership status
  // Use store.owned() which checks verified receipts first, then local if no validator.
  // Fallback to insecure localStorage check if store isn't ready or owned is false.
  const owned = store.owned(MY_NON_CONSUMABLE_ID) || isFeatureUnlocked();

  if (statusEl) {
    statusEl.innerHTML = `<b>Premium Feature: ${owned ? 'Unlocked! 🎉' : 'Locked'}</b>`;
    // In a real app, you would show/hide UI elements based on 'owned' status.
  }

  if (productEl) {
    if (!product) {
      productEl.innerHTML = '<p>Loading product details...</p>';
      return;
    }

    // Product loaded, display its details
    let productHtml = `
      <h3>${product.title}</h3>
      <p>${product.description}</p>
    `;
    const offer = product.getOffer();
    if (offer) {
      productHtml += `<p>Price: ${offer.pricing?.price ?? 'N/A'}</p>`;
      // Show buy button only if the product is not already owned and can be purchased
      if (!owned && offer.canPurchase) {
        // The purchaseFeature function will be implemented in platform-specific guides
        productHtml += `<button id="buy-button" onclick="purchaseFeature()">Unlock Now!</button>`;
      } else if (owned) {
        productHtml += `<p><em>(Already Purchased)</em></p>`;
      } else {
        productHtml += `<p>(Cannot purchase at this time)</p>`;
      }
    } else {
      productHtml += `<p>Pricing information not available.</p>`;
    }
    productEl.innerHTML = productHtml;
  }
}

// --- Placeholder for Purchase Action ---
// This will be implemented in the platform-specific guides (non-consumable-*.md)
window.purchaseFeature = function() {
  console.log('Placeholder: purchaseFeature() called.');
  alert('Purchase logic needs to be implemented for the specific platform.');
};

// --- Placeholder for Granting Entitlement ---
// This will be implemented in the platform-specific guides
function grantEntitlement(productId) {
  if (productId === MY_NON_CONSUMABLE_ID) {
    console.log(`Placeholder: Granting entitlement for ${productId}.`);
    // Persist ownership securely!
    try {
      window.localStorage.setItem(FEATURE_KEY, 'YES'); // INSECURE EXAMPLE
      console.log('Ownership flag set in localStorage.');
    } catch (e) {
      console.error('Error saving ownership to localStorage:', e);
    }
    refreshUI(); // Update UI immediately
  }
}

// Initial UI update on device ready
document.addEventListener('deviceready', () => {
  // Ensure the initial call to initializeStoreAndSetupListeners happens
  if (typeof initializeStoreAndSetupListeners === 'function') {
     // Already called by onDeviceReady in the initial script
  } else {
     initializeStoreAndSetupListeners = initializeStore;
     initializeStoreAndSetupListeners();
  }
  // Initial render based on potentially stored state
  refreshUI();
}, false);

// Ensure setStatus is defined
if (typeof setStatus !== 'function') {
  setStatus = (message) => console.log('[Status] ' + message);
}

```
{% endcode %}

**Explanation:**

1.  **Product Definition (Lines 9-11):** Define the `id` of your non-consumable product and a key (`FEATURE_KEY`) to track its ownership status locally.
2.  **Register Product (Lines 14-18):** Call `store.register()` with the `id`, `type` set to `ProductType.NON_CONSUMABLE`, and the correct `platform`.
3.  **Validator Setup (Lines 21-24):** Configure `store.validator`. This is **highly recommended** for non-consumables to securely verify purchases and enable reliable restoration across devices.
4.  **Event Listeners (Lines 27-44):**
    *   `productUpdated`: Refreshes the UI when product details load.
    *   `receiptUpdated`: Refreshes the UI when local receipt data changes (might affect `owned` status if no validator is used).
    *   `verified`: Refreshes the UI when a receipt is validated (this provides the most reliable ownership status).
    *   Purchase flow listeners (`approved`, `finished`, etc.) are deferred.
5.  **Initialize Store (Lines 47-56):** Call `store.initialize()` to activate the platform.
6.  **UI Rendering (Lines 60-106):**
    *   The `refreshUI` function now focuses on displaying the product and the *ownership status* of the feature.
    *   It uses `store.owned(MY_NON_CONSUMABLE_ID)` as the primary way to check ownership. This method intelligently uses verified receipt data if available (and a validator is configured), falling back to less reliable local data otherwise.
    *   It includes a fallback check to `isFeatureUnlocked()` (which reads from `localStorage` in this example) to handle cases where the store might not be fully ready or if validation isn't used. **Warning:** `localStorage` is insecure; use the [SecureStorage-adapter](https://github.com/mibrito707/cordova-plugin-securestorage-adapter) plugin or a server backend for production.
    *   The "Buy" button is only shown if the feature is *not* owned (`!owned`) and the offer `canPurchase`. If owned, it displays "(Already Purchased)".
7.  **Placeholders (Lines 109-125):** Empty functions `purchaseFeature` and `grantEntitlement` are defined for later implementation in platform-specific guides. `grantEntitlement` includes an *insecure* example of setting the `localStorage` flag.
8.  **Initial Load (Lines 128-138):** Ensures initialization runs and the UI reflects any previously stored ownership status on startup.

This setup prepares your app to display the non-consumable product and its current ownership state. The next steps involve implementing the platform-specific purchase flow (Android or iOS) to handle buying the product and securely granting/persisting the entitlement.

*Initial HTML modification suggestion for `./use-cases/sections/non-consumable-generic-initialization.md`: Adapt the example to unlock a feature instead of granting gold coins. For instance, show a "Feature Locked/Unlocked" status and a purchase button to unlock it.*

### Purchase Flow

Finally, we need to handle the purchase events triggered when the user buys the non-consumable product. This typically involves:
*   Initiating the order when the "Buy/Unlock" button is clicked.
*   Verifying the transaction with the receipt validator upon approval (optional but recommended).
*   Finishing the transaction once approved (or verified) to grant access permanently.
*   Updating the UI to reflect the unlocked status.

### Purchase Flow (iOS/App Store Non-Consumable)

This section details the purchase logic specific to **iOS/App Store** for **non-consumable** items (like unlocking a feature permanently), assuming you have completed the [generic non-consumable initialization](non-consumable-generic-initialization.md). Similar to Android, the purchase must be finalized using `transaction.finish()` to remove it from the payment queue.

**Step 1: Implement the Purchase Action (`purchaseFeature`)**

*   **What:** Replace the placeholder `window.purchaseFeature` function (from the generic initialization) to call `offer.order()` specifically for the App Store platform.
*   **Why:** This triggers the App Store purchase dialog when the user clicks the "Unlock Now!" button.

Replace the placeholder `window.purchaseFeature` function in `www/js/index.js`:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.purchaseFeature = function() {
    const productId = 'unlock_premium_feature'; // Use the SAME product ID you registered
    console.log(`Purchase button clicked for non-consumable: ${productId}`);
    const { store, Platform } = CdvPurchase;

    // Get the product specifically for AppStore
    const product = store.get(productId, Platform.APPLE_APPSTORE);
    const offer = product?.getOffer(); // Get the default offer

    if (offer) {
        console.log(`Initiating order for non-consumable offer: ${offer.id} on platform ${offer.platform}`);
        setStatus('Initiating purchase...');

        offer.order()
            .then(result => {
                // Promise resolves when the App Store sheet is dismissed.
                // Outcome is handled by listeners.
                if (result && result.isError) {
                    setStatus(`Order failed: ${result.message}`);
                } else {
                    // Purchase flow started... status updated by listeners.
                }
                refreshUI(); // Refresh UI in case button state needs update
            })
            .catch(err => {
                 console.error("Unexpected error during non-consumable order:", err);
                 setStatus('Unexpected error during purchase.');
                 refreshUI();
            });

    } else {
        console.error(`Cannot purchase feature: Product (${productId}) or offer not found.`);
        setStatus('Error: Unable to purchase. Product details missing.');
    }
}
```

**Step 2: Handle Purchase Events (`.approved`, `.verified`, `.finished`)**

*   **What:** Add the purchase lifecycle event listeners within the `store.when()` chain in your `initializeStoreAndSetupListeners` function (created during generic initialization).
*   **Why:** These listeners handle the progression of the purchase: approval by App Store, optional but recommended verification, and mandatory finalization.

Add these handlers inside the existing `store.when()` call:

```javascript
// Inside initializeStoreAndSetupListeners() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);
        setStatus('Purchase approved. Verifying...');

        // Verification is highly recommended for non-consumables.
        if (store.validator) {
            transaction.verify();
        } else {
             console.warn("Receipt validator not configured. Granting entitlement and finishing purchase without server verification (INSECURE).");
             // Grant entitlement and finish directly if no validator.
             unlockFeatureAndFinish(transaction);
        }
    })
    .verified(receipt => {
        console.log(`Receipt verified for transaction ${receipt.transactions[0]?.transactionId}`);
        setStatus('Purchase verified. Finishing...');

        // Find the relevant transaction within the verified receipt
        const verifiedTransaction = receipt.transactions
            .find(t => t.products[0]?.id === MY_NON_CONSUMABLE_ID); // Use your product ID

        if (verifiedTransaction) {
            // Grant entitlement (if not already done based on verified data)
            // and FINISH the transaction
            unlockFeatureAndFinish(verifiedTransaction);
        } else {
            console.error("Verified receipt didn't contain the expected non-consumable transaction?");
            // Finish anyway to clear the queue if possible
            receipt.finish();
        }
    })
    .finished(transaction => {
        // This confirms the finish() call was successful.
        console.log(`Transaction ${transaction.transactionId} finished for ${transaction.products[0]?.id}.`);
        setStatus('Purchase complete! Feature unlocked.');
        // Feature should already be unlocked. Refresh UI to be sure.
        refreshUI();
    })
    .cancelled(transaction => {
        console.log('Purchase Cancelled:', transaction.transactionId);
        setStatus('Purchase cancelled.');
        refreshUI();
    });
    // Ensure the .productUpdated, .receiptUpdated listeners from the generic setup are still present
```

**Step 3: Implement Feature Unlock and Finish Logic (`unlockFeatureAndFinish`)**

*   **What:** Replace the placeholder `grantEntitlement` function with `unlockFeatureAndFinish`. This function updates your app's state (e.g., `localStorage` - **use secure storage in production!**) to unlock the feature and then calls `transaction.finish()`.
*   **Why:** You **must** call `transaction.finish()` for non-consumable purchases on iOS to remove them from the payment queue. This acknowledges to the App Store that you have processed the transaction.

Replace the placeholder `grantEntitlement` function in `www/js/index.js` with this:

```javascript
// In js/index.js

// Replace the placeholder grantEntitlement function
function unlockFeatureAndFinish(transaction) {
    const productId = transaction.products[0]?.id;
    if (productId !== MY_NON_CONSUMABLE_ID) return; // Ensure it's the correct product

    // Grant the entitlement if not already granted
    // Check your persistent storage method here
    const isUnlocked = isFeatureUnlocked(); // Assumes function from generic init exists

    if (isUnlocked) {
        console.log(`Feature already unlocked, finishing transaction ${transaction.transactionId} again just in case.`);
    } else {
        console.log(`Unlocking feature for transaction ${transaction.transactionId}...`);
        // Persist the unlock status SECURELY
        try {
            window.localStorage.setItem(FEATURE_KEY, 'YES'); // INSECURE EXAMPLE - Use SecureStorage
            console.log('Ownership flag set in localStorage.');
        } catch (e) {
            console.error('Error saving ownership to localStorage:', e);
        }
        // Refresh the UI immediately to show the unlocked state
        refreshUI();
        // Optionally show a confirmation message
        // alert('Feature Unlocked! Thank you.');
    }

    // Finish the transaction!
    // This acknowledges the purchase with the App Store and removes it from the queue.
    // Required for non-consumables and subscriptions on iOS.
    if (transaction.state !== TransactionState.FINISHED) {
        console.log(`Finishing transaction ${transaction.transactionId}...`);
        transaction.finish();
    } else {
        console.log(`Transaction ${transaction.transactionId} already finished.`);
    }
}
```

---

**Build and Test (iOS/App Store Non-Consumable)**

Follow the standard iOS testing procedure:

1.  **Prepare:** `cordova prepare ios`.
2.  **Open:** `open platforms/ios/*.xcodeproj` (or `.xcworkspace`).
3.  **Configure Xcode:** Set signing team, select your physical test device. Ensure "In-App Purchase" capability is enabled.
4.  **Prepare Sandbox Tester:** On your test device, go to `Settings -> App Store`, scroll down, and **Sign Out** of any production Apple ID. Do **not** sign into the Sandbox account here.
5.  **Run:** Build and run the app from Xcode (▶) onto your device.
6.  **Test Purchase:**
    *   Verify initial UI shows the feature as "Locked" and the product details with the "Unlock Now!" button.
    *   Tap "Unlock Now!".
    *   The App Store purchase sheet appears. **Sign in** using your **Sandbox Tester** credentials when prompted.
    *   Confirm the purchase (it will indicate "[Environment: Sandbox]").
    *   Observe Xcode console logs: `approved`, `verified` (if validator set), `Unlocking feature...`, `Finishing transaction...`, `finished`.
    *   The UI should update to show "Premium Feature: Unlocked! 🎉".
    *   The "Unlock Now!" button should be replaced with "(Already Purchased)".
    *   **Restart the app:** Verify the unlocked status persists and the purchase button remains disabled.
    *   **Restore Purchases:** Add a "Restore Purchases" button that calls `store.restorePurchases()`. Test that after restoring, the UI correctly reflects the owned status.

---

This completes the non-consumable purchase flow for iOS/App Store. The key is calling `transaction.finish()` after granting the entitlement to acknowledge the purchase with Apple.