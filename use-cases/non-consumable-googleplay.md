# Non-Consumable on Google Play

This use case explains how to implement a **non-consumable** product (like unlocking a premium feature or removing ads permanently) on Android using the Google Play platform and `cordova-plugin-purchase` v13+.

## 1. Platform Setup

First, ensure your Google Play Console, application build, and test environment are correctly configured for Google Play Billing.

&rArr; [Setup instructions here](../setup/setup-googleplay.md).

## 2. Initialization & UI

Next, set up the basic JavaScript to initialize the plugin, register your non-consumable product, and display its information based on ownership status.


This section covers the initial setup and UI display for a **non-consumable** product (like unlocking a premium feature or removing ads) using the `cordova-plugin-purchase` plugin (v13+). It focuses on registering the product and displaying its information based on ownership status, deferring the actual purchase logic to platform-specific guides.

**Assumptions:**

*   You have completed the [basic Framework setup](/use-cases/setup/code-framework).
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


*   **Note:** Replace the placeholder product ID (`'unlock_premium_feature'`) and the storage key (`FEATURE_KEY`) in the code with your actual values. Update the `store.register` call within the included code to specify `Platform.GOOGLE_PLAY`. Replace the insecure `localStorage` example with a secure storage mechanism or server-side state management.

## 3. Purchase Flow

Implement the logic to handle the purchase process. This involves initiating the order and handling the `approved`, `verified` (highly recommended), and `finished` events to grant the entitlement permanently and **acknowledge** the purchase with Google Play using `transaction.finish()`. Acknowledgment is mandatory within 3 days on Google Play for non-consumables.


### Purchase Flow (Android/Google Play Non-Consumable)

This section details the purchase logic specific to **Android/Google Play** for **non-consumable** items (like unlocking a feature permanently), assuming you have completed the [generic non-consumable initialization](non-consumable-generic-initialization.md). The key step on Android is **acknowledging** the purchase within 3 days using `transaction.finish()` to prevent automatic refunds.

**Step 1: Implement the Purchase Action (`purchaseFeature`)**

*   **What:** Replace the placeholder `window.purchaseFeature` function (from the generic initialization) to call `offer.order()` specifically for the Google Play platform.
*   **Why:** This triggers the Google Play purchase dialog when the user clicks the "Unlock Now!" button.

Replace the placeholder `window.purchaseFeature` function in `www/js/index.js`:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.purchaseFeature = function() {
    const productId = 'unlock_premium_feature'; // Use the SAME product ID you registered
    console.log(`Purchase button clicked for non-consumable: ${productId}`);
    const { store, Platform } = CdvPurchase;

    // Get the product specifically for Google Play
    const product = store.get(productId, Platform.GOOGLE_PLAY);
    const offer = product?.getOffer(); // Get the default offer

    if (offer) {
        console.log(`Initiating order for non-consumable offer: ${offer.id} on platform ${offer.platform}`);
        setStatus('Initiating purchase...');

        // Optional: Add obfuscated account/profile IDs for fraud prevention
        // const additionalData = { googlePlay: { accountId: 'hashed_user_id' } };
        // offer.order(additionalData)
        offer.order()
            .then(result => {
                // Promise resolves when the Google Play UI is dismissed.
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
*   **Why:** These listeners handle the progression of the purchase: approval by Google Play, optional verification, and mandatory acknowledgment.

Add these handlers inside the existing `store.when()` call:

```javascript
// Inside initializeStoreAndSetupListeners() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);
        setStatus('Purchase approved. Verifying...');

        // Verification is highly recommended for non-consumables to prevent fraud.
        if (store.validator) {
            transaction.verify();
        } else {
             console.warn("Receipt validator not configured. Granting entitlement and acknowledging purchase without server verification (INSECURE).");
             // Grant entitlement and acknowledge directly if no validator.
             acknowledgeFeatureAndFinish(transaction);
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
            // and ACKNOWLEDGE the transaction
            acknowledgeFeatureAndFinish(verifiedTransaction);
        } else {
            console.error("Verified receipt didn't contain the expected non-consumable transaction?");
            // Finish anyway to clear the queue if possible
            receipt.finish();
        }
    })
    .finished(transaction => {
        // This confirms the acknowledgement call was successful.
        console.log(`Transaction ${transaction.transactionId} finished (acknowledged) for ${transaction.products[0]?.id}.`);
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

**Step 3: Implement Feature Unlock and Acknowledge Logic (`acknowledgeFeatureAndFinish`)**

*   **What:** Replace the placeholder `grantEntitlement` function with `acknowledgeFeatureAndFinish`. This function updates your app's state (e.g., `localStorage` - **use secure storage in production!**) to unlock the feature and then calls `transaction.finish()` to **acknowledge** the purchase with Google Play.
*   **Why:** You **must** acknowledge non-consumable purchases on Google Play within 3 days, otherwise Google will automatically refund the user and revoke the entitlement. Calling `transaction.finish()` performs this acknowledgment. **Do not consume non-consumables.**

Replace the placeholder `grantEntitlement` function in `www/js/index.js` with this:

```javascript
// In js/index.js

// Replace the placeholder grantEntitlement function
function acknowledgeFeatureAndFinish(transaction) {
    const productId = transaction.products[0]?.id;
    if (productId !== MY_NON_CONSUMABLE_ID) return; // Ensure it's the correct product

    // Grant the entitlement if not already granted
    // Check your persistent storage method here
    const isUnlocked = isFeatureUnlocked(); // Assumes function from generic init exists

    if (isUnlocked) {
        console.log(`Feature already unlocked, acknowledging transaction ${transaction.transactionId} again just in case.`);
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

    // Acknowledge the purchase with Google Play.
    // This is CRUCIAL for non-consumables on Android to prevent refunds.
    // It tells Google you have successfully processed the purchase.
    if (!transaction.isAcknowledged) {
        console.log(`Acknowledging (finishing) transaction ${transaction.transactionId}...`);
        transaction.finish();
    } else {
        console.log(`Transaction ${transaction.transactionId} already acknowledged.`);
    }
}
```

---

**Build and Test (Android/Google Play Non-Consumable)**

Testing Google Play In-App Purchases requires specific steps:

1.  **Create a Release Build:**
    *   Google Play Billing generally requires **release-signed APKs/AABs** for testing. Debug builds often fail.
    *   Generate a Java Keystore if you don't have one (`keytool ...`). **Back it up securely!**
    *   Build the signed release APK/AAB using your release key (e.g., via `cordova build android --release -- --keystore=... --alias=...` or a build script).

2.  **Upload to Google Play Console:**
    *   Navigate to your app in the Play Console.
    *   Go to **Release -> Testing -> Internal testing** (or Closed/Open testing).
    *   Create a new release and **upload the signed release build**.
    *   Add your tester Google account email addresses to the tester list for that track.
    *   **Save and roll out** the release. Wait for it to become available (can take minutes to hours).

3.  **Prepare Test Device:**
    *   Use a **physical Android device**. Emulators can be unreliable.
    *   Log into the device **only** with a Google account listed as a tester for your app's track. Remove other Google accounts temporarily if needed.
    *   Ensure the Google Play Store app is up-to-date.

4.  **Install and Run:**
    *   Testers must **accept the testing invitation** (usually via a Play Store link).
    *   Install the app **from the Google Play Store** using the testing link. Installing manually via `adb` often bypasses necessary Play Store setup.
    *   Open the app.
    *   Monitor logs using `adb logcat CordovaPurchase:V CordovaLog:V chromium:D *:S`.

5.  **Test the Purchase:**
    *   Navigate to where the non-consumable product is offered.
    *   **Verify Initial State:** Logs should show store initialization. UI should show the feature as "Locked" and the product details (title, price) with the "Unlock Now!" button should be visible.
    *   **Tap "Unlock Now!"**.
    *   The Google Play purchase sheet should appear, likely mentioning "Test card, always approves".
    *   **Confirm** the purchase.
    *   **Observe Logs and UI:**
        *   `approved` event log.
        *   `(If validator set)` `verified` event log.
        *   `Unlocking feature...` log from `acknowledgeFeatureAndFinish`.
        *   `Acknowledging (finishing) transaction...` log.
        *   `finished` event log.
    *   The UI should update to show "Premium Feature: Unlocked! 🎉".
    *   The "Unlock Now!" button should be replaced with "(Already Purchased)".
    *   **Restart the app:** Verify the unlocked status persists (reads from your storage mechanism) and the purchase button remains disabled.
    *   **Attempt Repurchase:** Tapping where the button was should do nothing, or trying to trigger the purchase again should ideally fail or be blocked by your UI logic based on the `owned` status.

---

This completes the non-consumable purchase flow for Android. The key takeaway is the necessity of **acknowledging** the purchase using `transaction.finish()` to prevent automatic refunds by Google Play.


## 4. Receipt Validation (Highly Recommended)

Server-side validation is crucial for non-consumables to securely verify ownership and prevent fraud.


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

Follow the specific testing procedures for Google Play (signed release build, testing tracks, license tester accounts) outlined in the platform-specific purchase flow section above.
