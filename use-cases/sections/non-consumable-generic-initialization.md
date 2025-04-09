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
