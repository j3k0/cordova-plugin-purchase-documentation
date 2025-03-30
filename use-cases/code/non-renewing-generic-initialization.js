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
  refreshUI(); // Initial render based on stored expiry
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