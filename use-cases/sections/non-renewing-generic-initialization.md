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
