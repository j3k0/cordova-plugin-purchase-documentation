# Non-Consumable on AppStore (iOS & macOS)

This use case explains how to implement a **non-consumable** product (like unlocking a premium feature or removing ads permanently) on iOS and macOS using the App Store platform and `cordova-plugin-purchase` v13+.

> **Capacitor:** This guide applies to both Cordova and Capacitor projects. The purchase API is identical — only the [installation](../setup/setup-capacitor.md) differs. In Capacitor, import the plugin directly instead of waiting for `deviceready`.

## 1. Platform Setup

First, ensure your Apple Developer account, App Store Connect, and Xcode project are correctly configured for In-App Purchases.

&rArr; [Setup instructions here](../setup/setup-appstore.md).

## 2. Initialization & UI

Next, set up the basic JavaScript to initialize the plugin, register your non-consumable product, and display its information based on ownership status.


This section covers the initial setup and UI display for a **non-consumable** product (like unlocking a premium feature or removing ads) using the `cordova-plugin-purchase` plugin (v13+). It focuses on registering the product and displaying its information based on ownership status, deferring the actual purchase logic to platform-specific guides.

**Assumptions:**

*   You have completed the [basic Framework setup](/../setup/code-framework.md).
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
  // WARNING: localStorage is INSECURE. Use server check.
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
    *   It includes a fallback check to `isFeatureUnlocked()` (which reads from `localStorage` in this example) to handle cases where the store might not be fully ready or if validation isn't used. **Warning:** `localStorage` is insecure; Use a server backend or a secure cloud storage for production.
    *   The "Buy" button is only shown if the feature is *not* owned (`!owned`) and the offer `canPurchase`. If owned, it displays "(Already Purchased)".
7.  **Placeholders (Lines 109-125):** Empty functions `purchaseFeature` and `grantEntitlement` are defined for later implementation in platform-specific guides. `grantEntitlement` includes an *insecure* example of setting the `localStorage` flag.
8.  **Initial Load (Lines 128-138):** Ensures initialization runs and the UI reflects any previously stored ownership status on startup.

This setup prepares your app to display the non-consumable product and its current ownership state. The next steps involve implementing the platform-specific purchase flow (Android or iOS) to handle buying the product and securely granting/persisting the entitlement.


*   **Note:** Replace the placeholder product ID (`'unlock_premium_feature'`) and the storage key (`FEATURE_KEY`) in the code with your actual values. Crucially, replace the insecure `localStorage` example in `grantEntitlement` and `isFeatureUnlocked` with a secure storage mechanism (like `cordova-plugin-securestorage-adapter`) or server-side state management.

## 3. Purchase Flow

Implement the logic to handle the purchase process. This involves initiating the order and handling the `approved`, `verified` (highly recommended), and `finished` events to grant the entitlement permanently and acknowledge the purchase with the App Store using `transaction.finish()`.


### Purchase Flow (iOS/App Store Non-Consumable)

This section details the purchase logic specific to **iOS/App Store** for **non-consumable** items (like unlocking a feature permanently). Similar to Android, the purchase must be finalized using `transaction.finish()` to remove it from the payment queue.

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

## 4. Receipt Validation (Highly Recommended)

Server-side validation is crucial for non-consumables to securely verify ownership and enable reliable purchase restoration across devices.


{% hint style="info" icon="info" %}
**Receipt Validation Reminder**

Remember, for subscriptions and non-consumables, relying solely on local device data is insecure and unreliable for managing entitlements.

**Always implement server-side receipt validation** using your own backend or a service like [Iaptic](https://www.iaptic.com/) to:
*   Confirm purchase legitimacy.
*   Get the authoritative subscription status and expiry date.
*   Prevent fraud.
*   Support cross-platform/device access.

Ensure `store.validator` is configured in your `initStore()` function.
{% endhint %}

## 5. Testing

Follow the specific testing procedures for iOS/macOS Sandbox environments outlined in the platform-specific purchase flow section above, including testing the "Restore Purchases" functionality.
