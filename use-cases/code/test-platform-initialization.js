// This function should be called by onDeviceReady after basic setup
function initializeStoreAndSetupListeners() {
  console.log('Setting up store for Test Platform...');
  setStatus('Initializing Test Store...');

  const { store, ProductType, Platform, LogLevel, ErrorCode, PaymentMode, RecurrenceMode } = CdvPurchase;

  // --- Register Test Products ---
  // You MUST register the products you intend to use with the Test platform.
  store.register([
    // 1. Using built-in test products (convenient for standard types)
    { id: 'test-consumable', type: ProductType.CONSUMABLE, platform: Platform.TEST },
    { id: 'test-non-consumable', type: ProductType.NON_CONSUMABLE, platform: Platform.TEST },
    { id: 'test-subscription', type: ProductType.PAID_SUBSCRIPTION, platform: Platform.TEST },
    // This one starts as already owned/approved
    { id: 'test-subscription-active', type: ProductType.PAID_SUBSCRIPTION, platform: Platform.TEST },
    // This one simulates a purchase failure
    { id: 'test-consumable-fail', type: ProductType.CONSUMABLE, platform: Platform.TEST },

    // 2. Defining and registering a custom test product inline
    {
      id: 'custom_test_feature',
      type: ProductType.NON_CONSUMABLE,
      platform: Platform.TEST,
      title: 'Unlock Custom Feature (Test)',
      description: 'A non-consumable defined directly in register.',
      pricing: { // Simple pricing for non-consumable
        price: '$1.49',
        currency: 'USD',
        priceMicros: 1490000
      }
    },
    // 3. Defining a custom test subscription inline
    {
      id: 'custom_test_sub_monthly',
      type: ProductType.PAID_SUBSCRIPTION,
      platform: Platform.TEST,
      title: 'Custom Monthly Sub (Test)',
      description: 'A subscription with a trial.',
      pricing: [ // Array of PricingPhase for subscriptions
        { // Trial Phase
          price: '$0.00', currency: 'USD', priceMicros: 0,
          paymentMode: PaymentMode.FREE_TRIAL,
          recurrenceMode: RecurrenceMode.FINITE_RECURRING,
          billingCycles: 1, billingPeriod: 'P1W' // 1 week trial
        },
        { // Regular Phase
          price: '$4.99', currency: 'USD', priceMicros: 4990000,
          paymentMode: PaymentMode.PAY_AS_YOU_GO,
          recurrenceMode: RecurrenceMode.INFINITE_RECURRING,
          billingPeriod: 'P1M' // $4.99 per month
        }
      ]
    }
  ]);

  // --- Optional: Mock Validator ---
  // If you set a validator URL, the Test platform provides a mock function
  // that simulates a successful validation after a short delay.
  // This helps test the .verified() event flow.
  // store.validator = "TEST_VALIDATOR"; // Any non-empty string enables mock validation

  // --- Setup Event Listeners ---
  store.when()
    .productUpdated(product => {
      console.log('Product updated: ' + product.id);
      refreshUI(); // Update the UI with product details
    })
    .approved(transaction => {
      console.log(`Approved: ${transaction.transactionId} for ${transaction.products[0].id}`);
      setStatus(`Approved ${transaction.products[0].id}. Verifying...`);
      // For the Test platform, verify() simulates success immediately (or after 500ms if validator is set)
      transaction.verify();
    })
    .verified(receipt => {
      console.log(`Verified: ${receipt.id}`);
      setStatus(`Verified ${receipt.collection[0]?.id ?? ''}. Finishing...`);
      // Finish the transaction to acknowledge/consume it
      receipt.finish();
    })
    .finished(transaction => {
      console.log(`Finished: ${transaction.transactionId} for ${transaction.products[0].id}`);
      setStatus(`Purchase complete for ${transaction.products[0].id}!`);
      // Grant entitlement based on product type
      if (transaction.products[0].id.includes('consumable')) {
        grantCoins(1); // Example: grant 1 unit
      } else {
        grantEntitlement(transaction.products[0].id); // For non-consumables/subs
      }
      refreshUI(); // Update UI after granting
    })
    .cancelled(transaction => {
      console.log('Cancelled:', transaction.transactionId);
      setStatus('Purchase cancelled.');
      refreshUI();
    });
    // Global store.error handler is already set up in initial script

  // --- Initialize the Store ---
  // Initialize ONLY the Test platform.
  store.initialize([Platform.TEST])
    .then(() => {
      console.log('Test Store initialized successfully.');
      setStatus('Test Store ready.');
      refreshUI(); // Render the UI with initial product data
    })
    .catch(err => {
      console.error('Test Store initialization failed:', err);
      setStatus('Test Store failed to initialize.');
    });
}

// --- UI Rendering ---
// (Includes placeholders for balance/feature status - adapt as needed)
let userCoinBalance = 0; // Example balance
const FEATURE_KEY = 'isCustomFeatureUnlocked'; // Example key

function refreshUI() {
  console.log('Refreshing Test UI...');
  const { store, Platform, Utils } = CdvPurchase;

  const productsEl = document.getElementById('product-details');
  const statusEl = document.getElementById('user-status');
  if (!productsEl || !statusEl) return;

  // Display Balance/Feature Status (Example)
  const featureUnlocked = localStorage.getItem(FEATURE_KEY) === 'YES';
  statusEl.innerHTML = `<b>Coins: ${userCoinBalance}</b> | <b>Custom Feature: ${featureUnlocked ? 'Unlocked' : 'Locked'}</b>`;

  // Display Products
  productsEl.innerHTML = store.products
    .filter(p => p.platform === Platform.TEST) // Show only test products
    .map(product => {
      let productHtml = `<div><h4>${product.title || product.id} (${product.type})</h4>`;
      if (product.description) productHtml += `<p>${product.description}</p>`;

      const offer = product.getOffer(); // Get the default offer
      if (offer) {
        const priceDetails = offer.pricingPhases.map(phase => {
           let phaseDesc = `${phase.price}`;
           if (phase.billingPeriod) phaseDesc += ` / ${Utils.formatDurationEN(phase.billingPeriod, { omitOne: true })}`;
           if (phase.paymentMode === PaymentMode.FREE_TRIAL) phaseDesc = `Free Trial (${Utils.formatDurationEN(phase.billingPeriod)})`;
           return phaseDesc;
        }).join(' then ');
        productHtml += `<p>Price: ${priceDetails}</p>`;

        // Determine if owned (using store.owned which checks verified/local)
        const owned = store.owned(product);

        if (owned && product.type !== ProductType.CONSUMABLE) {
          productHtml += `<p><em>(Owned)</em></p>`;
          if (product.type === ProductType.PAID_SUBSCRIPTION) {
             const purchase = store.findInVerifiedReceipts(product) ?? store.findInLocalReceipts(product);
             if (purchase?.expirationDate) {
                 productHtml += `<p>Expires: ${purchase.expirationDate.toLocaleDateString()}</p>`;
             }
          }
        } else if (offer.canPurchase) {
          productHtml += `<button onclick="buyTestProduct('${product.id}')">Buy</button>`;
        } else {
          productHtml += `<p>(Cannot purchase)</p>`;
        }
      } else {
        productHtml += '<p>Offer not available.</p>';
      }
      productHtml += `</div>`;
      return productHtml;
    }).join('<hr/>');
}

// --- Placeholder for Purchase Action ---
window.buyTestProduct = function(productId) {
  console.log(`Placeholder: buyTestProduct('${productId}') called.`);
  alert('Purchase logic needs implementation (see test-platform-purchase.js).');
};

// --- Placeholder for Granting Logic ---
function grantCoins(amount) {
  console.log(`Placeholder: Granting ${amount} coins.`);
  userCoinBalance += amount;
  // Persist balance securely in a real app
}
function grantEntitlement(productId) {
  console.log(`Placeholder: Granting entitlement for ${productId}.`);
  if (productId === 'custom_test_feature') {
    localStorage.setItem(FEATURE_KEY, 'YES'); // INSECURE EXAMPLE
  }
  // Handle subscription activation if needed
}

// Initial UI update on device ready
document.addEventListener('deviceready', () => {
  if (typeof initializeStoreAndSetupListeners === 'function') {
     // Called by onDeviceReady
  } else {
     initializeStoreAndSetupListeners = initializeStore;
     initializeStoreAndSetupListeners();
  }
  refreshUI();
}, false);

// Ensure setStatus and Utils are defined
if (typeof setStatus !== 'function') { setStatus = (message) => console.log('[Status] ' + message); }
if (!CdvPurchase.Utils) CdvPurchase.Utils = {};
if (!CdvPurchase.Utils.formatDurationEN) { CdvPurchase.Utils.formatDurationEN = (iso) => iso || ''; }
