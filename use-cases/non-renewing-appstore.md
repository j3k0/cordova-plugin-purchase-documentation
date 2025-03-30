# Non-Renewing Subscription on AppStore (iOS & macOS)

This use case explains how to implement a **non-renewing subscription** product (granting access for a fixed period) on iOS and macOS using the App Store platform and `cordova-plugin-purchase` v13+. Your application is responsible for managing the expiry date.

# Non-Renewing Subscription on iOS & macOS

This guide demonstrates how to implement a **non-renewing subscription** product using the AppStore platform for iOS and macOS applications.

Non-renewing subscriptions grant access to content or services for a **fixed, limited duration** (e.g., 1 month, 6 months, 1 year). Unlike auto-renewing subscriptions, they **do not automatically renew** at the end of the period. The user must explicitly purchase the subscription again to extend access.

Key characteristics on Apple platforms:

*   Purchased as a one-time transaction via StoreKit.
*   Entitlement management (tracking expiry) is **entirely handled by your application logic** after the initial purchase. Apple does not track the expiry or renewal status for these.
*   Often used for time-limited access to content archives, seasonal passes, or services where auto-renewal isn't desired or appropriate.
*   Requires careful handling of expiry dates based on the purchase time and product duration.
*   Requires **acknowledging** the purchase using `transaction.finish()` to remove it from the payment queue.
*   Requires syncing purchase status and expiry across devices if you support user accounts (typically via your own backend).

In this guide, we will build a simple application that allows users to purchase a non-renewing subscription which grants access for a defined period, managing the expiry date within the app.

## 1. Platform Setup

First, ensure your Apple Developer account, App Store Connect (including creating the non-renewing subscription product), and Xcode project are correctly configured.

&rArr; [Setup instructions here](/use-cases/setup/setup-appstore).

## 2. Initialization & UI

Next, set up the basic JavaScript to initialize the plugin, register your non-renewing product, and display its information based on the access expiry date managed by your app.

This section covers the initial setup and UI display for a **non-renewing subscription** product (granting access for a fixed period like 1 month or 1 year) using the `cordova-plugin-purchase` plugin (v13+). It focuses on registering the product and displaying its information based on the access expiry date managed by your application. The actual purchase logic is deferred to platform-specific guides.

**Assumptions:**

*   You have completed the [basic JavaScript setup](code-initial-javascript.md).
*   You have created a non-renewing subscription product in your target platform's developer console.

**Step 1: Implement `initializeStoreAndSetupListeners`**

Replace the placeholder `initializeStoreAndSetupListeners` function with the following code. This registers your non-renewing subscription product, optionally sets up a validator (useful for getting an accurate purchase date), adds listeners for UI updates, and initializes the store.

{% code title="www/js/index.js (initializeStoreAndSetupListeners)" lineNumbers="true" %}
```javascript
// This function should be called by onDeviceReady after basic setup
function initializeStoreAndSetupListeners() {
  console.log('Setting up store for Non-Renewing Subscriptions...');
  setStatus('Initializing Store for Non-Renewing Subscriptions...');

  const { store, ProductType, Platform, LogLevel, Utils } = CdvPurchase;

  // --- Product Definition ---
  // Define the non-renewing product ID you configured in the App/Play Store.
  const MY_NON_RENEWING_ID = 'non_renewing_1_month'; // Replace with your actual ID
  // Key for storing expiry date (use SecureStorage in production!)
  const ACCESS_EXPIRY_KEY = 'myServiceAccessExpiry';

  // --- Register Product ---
  store.register({
    id: MY_NON_RENEWING_ID,
    type: ProductType.NON_RENEWING_SUBSCRIPTION,
    platform: store.defaultPlatform() // Or specify Platform.GOOGLE_PLAY, Platform.APPLE_APPSTORE
  });

  // --- Optional: Setup Receipt Validator ---
  // Recommended for getting an accurate purchaseDate for expiry calculation.
  // store.validator = "https://your-validator.com/validate";
  // store.validator = new CdvPurchase.Iaptic({...}).validator;

  // --- Setup Event Listeners ---
  store.when()
    .productUpdated(product => {
      console.log('Product updated: ' + product.id);
      refreshUI(); // Update the UI with product details & access status
    })
    .receiptUpdated(receipt => {
      console.log('Local receipt updated.');
      refreshUI(); // Refresh UI as local state might change
    })
    .verified(receipt => {
      // If using a validator, this provides the most reliable purchase data.
      console.log('Receipt verified.');
      refreshUI(); // Refresh UI based on verified data (which might impact expiry display)
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

// Function to check access expiry (reads from storage)
function getAccessExpiryDate() {
  // WARNING: localStorage is INSECURE. Use SecureStorage plugin or server check.
  try {
    const expiryString = window.localStorage.getItem(ACCESS_EXPIRY_KEY);
    return expiryString ? new Date(expiryString) : null;
  } catch (e) {
    console.error('Error reading expiry from localStorage:', e);
    return null;
  }
}

// This function updates the UI based on product data and access expiry
function refreshUI() {
  console.log('Refreshing Non-Renewing UI...');
  const { store, Platform, Utils } = CdvPurchase;

  const product = store.get(MY_NON_RENEWING_ID);
  const productEl = document.getElementById('product-details');
  const statusEl = document.getElementById('user-status'); // Target the status display area

  const expiryDate = getAccessExpiryDate();
  const hasAccess = expiryDate && expiryDate > new Date();

  if (statusEl) {
    statusEl.innerHTML = `<b>Access Status: ${hasAccess ? 'Active' : 'Inactive'}</b>`;
    if (hasAccess) {
      statusEl.innerHTML += ` (Expires: ${expiryDate.toLocaleDateString()})`;
    }
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
      // Non-renewing typically have a single phase defining the duration/price
      const phase = offer.pricingPhases[0];
      if (phase) {
        productHtml += `<p>Price: ${phase.price} for ${Utils.formatDurationEN(phase.billingPeriod)}</p>`;
      } else {
        productHtml += `<p>Price: N/A</p>`;
      }

      // Allow purchase if the offer is valid (canPurchase checks basic validity)
      // You might add logic here to prevent purchase if access is already active,
      // or allow stacking/extending based on your app's rules.
      if (offer.canPurchase) {
        // The purchaseNonRenewing function will be implemented in platform-specific guides
        const buttonText = hasAccess ? 'Extend Access' : 'Buy Access';
        productHtml += `<button id="buy-button" onclick="purchaseNonRenewing()">${buttonText}</button>`;
      } else {
        productHtml += `<p>(Cannot purchase at this time)</p>`;
      }
    } else {
      productHtml += `<p>Offer information not available.</p>`;
    }
    productEl.innerHTML = productHtml;
  }
}

// --- Placeholder for Purchase Action ---
// This will be implemented in the platform-specific guides (non-renewing-*.md)
window.purchaseNonRenewing = function() {
  console.log('Placeholder: purchaseNonRenewing() called.');
  alert('Purchase logic needs to be implemented for the specific platform.');
};

// --- Placeholder for Granting/Acknowledging Logic ---
// This will be implemented in the platform-specific guides
function grantAccessAndFinish(transaction) {
  console.log(`Placeholder: Granting access and finishing ${transaction.transactionId}.`);
  // Logic to calculate expiry, save it, and call transaction.finish()
  refreshUI();
}

// Initial UI update on device ready
document.addEventListener('deviceready', () => {
  if (typeof initializeStoreAndSetupListeners === 'function') {
     // Called by onDeviceReady in the initial script
  } else {
     initializeStoreAndSetupListeners = initializeStore;
     initializeStoreAndSetupListeners();
  }
  // Initial render based on stored expiry
  refreshUI();
}, false);

// Ensure setStatus is defined
if (typeof setStatus !== 'function') {
  setStatus = (message) => console.log('[Status] ' + message);
}

// Ensure Utils are available (should be from store.js)
if (!CdvPurchase.Utils) CdvPurchase.Utils = {};
if (!CdvPurchase.Utils.formatDurationEN) {
    CdvPurchase.Utils.formatDurationEN = (iso) => iso || ''; // Basic fallback
}

```
{% endcode %}

**Explanation:**

1.  **Product Definition (Lines 9-13):** Define the `id` of your non-renewing product and a key (`ACCESS_EXPIRY_KEY`) to track its expiry date locally.
2.  **Register Product (Lines 16-20):** Call `store.register()` with the `id`, `type` set to `ProductType.NON_RENEWING_SUBSCRIPTION`, and the correct `platform`.
3.  **Validator Setup (Lines 23-26):** Configuring `store.validator` is optional but recommended. It allows you to get a server-verified `purchaseDate` from the transaction, which is more reliable for calculating the expiry date than relying solely on the device's clock at the time of purchase approval.
4.  **Event Listeners (Lines 29-46):** Listeners for `productUpdated`, `receiptUpdated`, and `verified` are set up primarily to trigger `refreshUI()`, ensuring the displayed access status and product details are current.
5.  **Initialize Store (Lines 49-58):** Call `store.initialize()` to activate the platform.
6.  **UI Rendering (`refreshUI` - Lines 74-121):**
    *   This function now focuses on displaying the access status based on the expiry date stored locally (using `getAccessExpiryDate`).
    *   It calculates if access is currently active by comparing the stored expiry date to the current time.
    *   It displays the product details, including the duration (formatted using `Utils.formatDurationEN`).
    *   The purchase button text changes ("Buy Access" or "Extend Access") based on whether access is currently active. The `purchaseNonRenewing()` function (implemented later) will handle the purchase logic.
7.  **Placeholders (Lines 124-133):** Empty functions `purchaseNonRenewing` and `grantAccessAndFinish` are defined for later implementation in platform-specific guides. `grantAccessAndFinish` will contain the crucial logic for calculating expiry, storing it, and calling `transaction.finish()`.
8.  **Initial Load & Helpers (Lines 136-end):** Ensures initialization runs and the UI reflects any previously stored expiry status on startup. Includes the `formatDurationEN` helper.

This setup prepares your app to display non-renewing subscription products and their current access status based on locally managed expiry dates. The next steps involve implementing the platform-specific purchase flow and the `grantAccessAndFinish` logic.
*   **Note:** Replace the placeholder product ID (`'non_renewing_1_month'`) and the storage key (`ACCESS_EXPIRY_KEY`) with your actual values. Use a secure method (SecureStorage plugin or server backend) instead of `localStorage` to store the expiry date in production.

## 3. Purchase Flow

Implement the logic to handle the purchase process. This involves initiating the order, handling `approved` and `verified` (recommended for accurate purchase date), calculating and storing the expiry date, and acknowledging the purchase with `transaction.finish()`.

### Purchase Flow (iOS/App Store Non-Renewing Subscription)

This section implements the purchase logic for **non-renewing subscriptions** on **iOS/App Store**, assuming you have completed the [generic non-renewing initialization](non-renewing-generic-initialization.md). Your application manages the entitlement period, and you **must acknowledge** the purchase using `transaction.finish()`.

**Step 1: Implement the Purchase Action (`purchaseNonRenewing`)**

*   **What:** Replace the placeholder `window.purchaseNonRenewing` function to call `offer.order()` for the App Store platform.
*   **Why:** Starts the App Store purchase process for the non-renewing product.

{% code title="www/js/index.js (purchaseNonRenewing)" %}
```javascript
// Replace the placeholder purchaseNonRenewing function
window.purchaseNonRenewing = function() {
    const productId = 'non_renewing_1_month'; // Use the SAME product ID you registered
    console.log(`Purchase button clicked for non-renewing: ${productId}`);
    const { store, Platform } = CdvPurchase;

    const product = store.get(productId, Platform.APPLE_APPSTORE);
    const offer = product?.getOffer(); // Assuming a default offer

    if (offer) {
        console.log(`Initiating order for non-renewing offer: ${offer.id}`);
        setStatus('Initiating purchase...');

        offer.order()
            .then(result => {
                if (result && result.isError) {
                    setStatus(`Order failed: ${result.message}`);
                } else {
                    // Purchase flow started... status updated by listeners.
                }
                refreshUI();
            })
            .catch(err => {
                 console.error("Unexpected error during non-renewing order:", err);
                 setStatus('Unexpected error during purchase.');
                 refreshUI();
            });
    } else {
        console.error(`Cannot purchase: Product (${productId}) or offer not found.`);
        setStatus('Error: Unable to purchase. Product details missing.');
    }
}
```
{% endcode %}

**Step 2: Handle Purchase Events (`.approved`, `.verified`, `.finished`)**

*   **What:** Add the purchase lifecycle event listeners within the `store.when()` chain in `initializeStoreAndSetupListeners`.
*   **Why:** These listeners handle the purchase approval, optional verification (useful for getting an accurate `purchaseDate`), and mandatory acknowledgment.

Add these handlers inside the existing `store.when()` call:

{% code title="www/js/index.js (listeners within store.when)" %}
```javascript
  .approved(transaction => {
    console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);
    setStatus('Purchase approved. Verifying...');
    // Verify if a validator is configured (optional but recommended for purchaseDate)
    if (store.validator) {
      transaction.verify();
    } else {
      console.warn("Receipt validator not configured. Using local date for expiry calculation.");
      grantAccessAndFinish(transaction); // Proceed without validation
    }
  })
  .verified(receipt => {
    console.log(`Receipt verified for transaction ${receipt.transactions[0]?.transactionId}`);
    setStatus('Purchase verified. Finishing...');
    const verifiedTransaction = receipt.transactions.find(t => t.products[0]?.id === MY_NON_RENEWING_ID);
    if (verifiedTransaction) {
      grantAccessAndFinish(verifiedTransaction); // Use verified transaction data
    } else {
      console.error("Verified receipt didn't contain the expected transaction?");
      receipt.finish(); // Finish anyway
    }
  })
  .finished(transaction => {
    console.log(`Transaction ${transaction.transactionId} finished for ${transaction.products[0]?.id}.`);
    setStatus('Purchase complete! Access updated.');
    refreshUI(); // Refresh expiry display
  })
  .cancelled(transaction => {
    console.log('Purchase Cancelled:', transaction.transactionId);
    setStatus('Purchase cancelled.');
    refreshUI();
  });
```
{% endcode %}

**Step 3: Implement Access Granting, Expiry Calculation, and Finishing (`grantAccessAndFinish`)**

*   **What:** Replace the placeholder `grantAccessAndFinish` function. This calculates the expiry date based on the product's duration and the transaction's `purchaseDate`, stores this expiry date persistently (**use SecureStorage in production!**), updates the UI, and calls `transaction.finish()`.
*   **Why:** Your app manages the entitlement period. `finish()` is **mandatory** for iOS to acknowledge the transaction and remove it from the payment queue.

Replace the placeholder `grantAccessAndFinish` function in `www/js/index.js`:

{% code title="www/js/index.js (grantAccessAndFinish)" %}
```javascript
// Replace the placeholder grantAccessAndFinish function
function grantAccessAndFinish(transaction) {
    const productId = transaction.products[0]?.id;
    if (productId !== MY_NON_RENEWING_ID) return; // Ensure correct product

    console.log(`Granting access for non-renewing subscription ${productId}, transaction ${transaction.transactionId}...`);

    // 1. Determine duration based on productId (e.g., from product metadata or a config map)
    let durationMonths = 0;
    if (productId === 'non_renewing_1_month') { // <<< YOUR Non-Renewing Product ID
        durationMonths = 1;
    } // Add else if for other durations

    if (durationMonths === 0) {
        console.error(`Unknown duration for product ${productId}. Cannot grant access.`);
        if (transaction.state !== TransactionState.FINISHED) transaction.finish(); // Finish anyway
        return;
    }

    // 2. Get purchase date (verified date is preferred, fallback to transaction date or now)
    const purchaseDate = transaction.purchaseDate || new Date();

    // 3. Calculate new expiry date (handle extending existing access)
    const currentExpiry = getAccessExpiryDate(); // Function from generic init
    const startDateMs = Math.max(Date.now(), currentExpiry ? currentExpiry.getTime() : 0);
    const newExpiryDate = new Date(startDateMs);
    newExpiryDate.setMonth(newExpiryDate.getMonth() + durationMonths);

    console.log(`Purchase Date: ${purchaseDate.toISOString()}`);
    console.log(`Current Expiry: ${currentExpiry?.toISOString() ?? 'None'}`);
    console.log(`Calculated New Expiry: ${newExpiryDate.toISOString()} (Duration: ${durationMonths} months)`);

    // 4. Store the new expiry date persistently (Use SecureStorage in production!)
    try {
        window.localStorage.setItem(ACCESS_EXPIRY_KEY, newExpiryDate.toISOString());
        console.log('Expiry date saved to localStorage.');
    } catch (e) {
        console.error('Error saving expiry to localStorage:', e);
    }

    // 5. Refresh UI immediately (optional, .finished listener also calls refreshUI)
    // refreshUI();
    // alert(`Access granted/extended until ${newExpiryDate.toLocaleDateString()}!`);

    // 6. Finish the transaction with the App Store
    // This acknowledges the purchase and removes it from the payment queue.
    if (transaction.state !== TransactionState.FINISHED) {
        console.log(`Finishing transaction ${transaction.transactionId}...`);
        transaction.finish();
    } else {
        console.log(`Transaction ${transaction.transactionId} already finished.`);
    }
}
```
{% endcode %}

---

**Build and Test (iOS/App Store Non-Renewing)**

Follow the standard iOS testing procedure:

1.  **Prepare & Build:** `cordova prepare ios`, then open and build in Xcode.
2.  **Sandbox Tester:** Ensure device is signed out of App Store, use Sandbox account when prompted by the app.
3.  **Run:** Launch from Xcode on a physical device.
4.  **Test Purchase:**
    *   Verify initial UI (access status, product details, button).
    *   Tap "Buy Access" / "Extend Access".
    *   Sign in with Sandbox Tester.
    *   Confirm purchase.
    *   Observe logs: `approved`, `verified` (if validator set), `Granting access...`, `Calculated New Expiry...`, `Finishing transaction...`, `finished`.
    *   Verify the UI updates with the correct expiry date.
    *   **Restart app:** Ensure expiry persists in your storage.
    *   **Test Extension:** Purchase again and verify the expiry date extends correctly based on your logic in `grantAccessAndFinish`.

---

This handles the non-renewing subscription flow on iOS/App Store, ensuring the purchase is acknowledged via `transaction.finish()` while your application manages the entitlement period based on the calculated expiry date.

## 4. Receipt Validation (Recommended)

While your app manages the expiry, validating the receipt provides a secure way to confirm the purchase happened and obtain a reliable `purchaseDate` for calculating the expiry.

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

Follow the specific testing procedures for iOS/macOS Sandbox environments outlined in the platform-specific purchase flow section above. Test purchasing, expiry checks, and potentially extending access by purchasing again.
