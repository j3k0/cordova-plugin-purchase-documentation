

# Using the Test Platform

This guide explains how to leverage the built-in `Test` platform adapter (`CdvPurchase.Platform.TEST`) for local development and testing of your In-App Purchase logic.

**Purpose:**

The Test platform simulates basic purchase flows **without connecting to any real app stores** (App Store, Google Play) or payment gateways. It's useful for:

*   **Rapid UI Development:** Quickly build and test your store interface, product display, and button interactions.
*   **Basic Logic Testing:** Verify your event handling logic (`approved`, `verified`, `finished`, `cancelled`) in a controlled environment.
*   **Offline Development:** Work on IAP integration without needing network connectivity or configured test accounts.
*   **Demonstrations:** Show purchase flows without involving real money or complex setup.

**Limitations:**

*   **No Real Transactions:** It does **not** involve any actual payments or communication with Apple/Google servers.
*   **Mock Validation:** Calling `transaction.verify()` triggers an immediate, simulated success response. It does **not** perform real server-side validation.
*   **Simplified Behavior:** It uses JavaScript `prompt()` for purchase confirmation and doesn't replicate platform-specific UI or complex scenarios (pending purchases, detailed errors, subscription management nuances).
*   **No Real Product Data:** Uses built-in mock products or custom definitions provided during registration, not live data from app stores.

**Use Cases:** Focus on testing your application's UI flow and basic event handling logic. **Do not** rely on it for testing security, real-world edge cases, or the specifics of subscription renewals/management.

**Always test thoroughly on real devices using actual platform Sandbox/Test accounts before releasing your application.**

The Code Implementation section will detail how to set up and use the Test platform.


## Code Implementation

This section explains how to use the `Test` platform adapter for local development and testing without needing actual store accounts or network connectivity to external services.

### 1. Base Framework

Ensure you have the basic HTML structure and initial JavaScript setup (waiting for `deviceready`, basic plugin checks, `setStatus` helper, placeholder functions) as outlined in the [Code Framework Setup](../setup/code-framework.md) section.

### 2. Initialization (`initializeStoreAndSetupListeners`)

Implement the `initializeStoreAndSetupListeners` function to configure and initialize the Test platform. This involves registering test products and setting up event listeners.

{% code title="www/js/index.js (initializeStoreAndSetupListeners)" lineNumbers="true" %}
```javascript
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
      console.log(`Approved: ![{transaction.transactionId} for ](<html>
<head><title>405 Not Allowed</title></head>
<body bgcolor="white">
<center><h1>405 Not Allowed</h1></center>
</body>
</html> "{transaction.transactionId} for ")
{transaction.products[0].id}`);
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

```
{% endcode %}

**Explanation:**

*   **Register Test Products (Lines 11-65):**
    *   You **must** register any product ID you want to use with `Platform.TEST`.
    *   You can use built-in product definitions like `CdvPurchase.Test.testProducts.CONSUMABLE` (Lines 15-24) for convenience. See the code comments or API docs for available built-in products (`CONSUMABLE`, `NON_CONSUMABLE`, `PAID_SUBSCRIPTION`, `PAID_SUBSCRIPTION_ACTIVE`, `CONSUMABLE_FAILING`).
    *   You can also define **custom test products** directly within `store.register` (Lines 27-65). Provide `id`, `type`, `platform: Platform.TEST`, and optionally `title`, `description`, and `pricing`. The `pricing` can be a simple object for one-time purchases or an array of `PricingPhase` objects for subscriptions.
*   **Mock Validator (Lines 68-72):** If you set `store.validator` to any non-empty string (e.g., `"TEST_VALIDATOR"`), the Test platform will simulate a successful validation response after a 500ms delay when `transaction.verify()` is called. This allows you to test the `.verified()` event flow.
*   **Event Listeners (Lines 75-100):** Basic listeners are set up:
    *   `productUpdated`: Refreshes the UI when product details are ready.
    *   `approved`: Calls `transaction.verify()` (which triggers the mock validation if enabled).
    *   `verified`: Calls `receipt.finish()` to complete the transaction.
    *   `finished`: Calls functions to grant the item (`grantCoins` or `grantEntitlement`) and refreshes the UI.
    *   `cancelled`: Updates the status message.
*   **Initialize Store (Lines 103-112):** Calls `store.initialize([Platform.TEST])` to activate *only* the Test adapter.

### 3. Purchase Flow (`buyTestProduct`)

Implement the function called by your "Buy" buttons to initiate a test purchase using `offer.order()`.

{% code title="www/js/index.js (buyTestProduct)" lineNumbers="true" %}
```javascript
// This function is called by the "Buy" buttons in the UI
window.buyTestProduct = function(productId) {
  console.log(`Buy button clicked for test product: ${productId}`);
  const { store, Platform, ErrorCode } = CdvPurchase;

  const product = store.get(productId, Platform.TEST);
  const offer = product?.getOffer(); // Get the default offer

  if (offer) {
    setStatus(`Initiating purchase for ${productId}...`);
    console.log(`Ordering offer: ${offer.id}`);

    offer.order()
      .then(result => {
        // Promise resolves when the prompt() is dismissed or if there's an immediate error.
        // The final outcome (approved, cancelled, failed) is handled by the event listeners.
        if (result && result.isError) {
          // This typically catches errors *before* the prompt, like "cannot purchase".
          // The prompt interaction itself usually triggers listeners, not this promise rejection.
          setStatus(`Order failed: ${result.message}`);
        } else {
          // Order initiated, waiting for user interaction with the prompt...
          // Status will be updated by .approved, .cancelled, or .error listeners.
        }
        refreshUI(); // Refresh UI, e.g., disable button temporarily
      })
      .catch(err => {
        // Catch unexpected errors during order initiation
        console.error(`Unexpected error ordering ${productId}:`, err);
        setStatus('Unexpected error during purchase.');
        refreshUI();
      });

  } else {
    console.error(`Cannot purchase: Product (${productId}) or offer not found.`);
    setStatus('Error: Unable to purchase. Product/Offer missing.');
  }
}

// --- Explanation of the Prompt ---
/*
When offer.order() is called for Platform.TEST, the following happens:

1. A JavaScript `prompt()` dialog appears in the browser/WebView.
2. The prompt message asks:
   `Do you want to purchase ![{productId} for ](<html>
<head><title>405 Not Allowed</title></head>
<body bgcolor="white">
<center><h1>405 Not Allowed</h1></center>
</body>
</html> "{productId} for ")
{price}? Enter "Y" to confirm. Enter "E" to fail with an error. Anything else to cancel.`
3. User Interaction:
   - Entering "Y" (case-insensitive) and clicking OK: Simulates a successful purchase approval. The `.approved()` event listener will be triggered shortly after.
   - Entering "E" (case-insensitive) and clicking OK: Simulates a purchase failure. The global `store.error()` handler will be triggered with an ErrorCode.PURCHASE error.
   - Clicking "Cancel" or entering anything else and clicking OK: Simulates the user cancelling the purchase. The `.cancelled()` event listener will be triggered.
*/

// Ensure setStatus and refreshUI are defined (should be in initialization script)
if (typeof setStatus !== 'function') { setStatus = (message) => console.log('[Status] ' + message); }
if (typeof refreshUI !== 'function') { refreshUI = () => console.log('Placeholder: refreshUI()'); }

```
{% endcode %}

**Explanation:**

*   **Get Offer (Lines 6-8):** Retrieves the product and its default offer.
*   **Call `offer.order()` (Line 14):** This is the key call to start the purchase simulation.
*   **Prompt Interaction (Lines 30-42):** When `offer.order()` runs for `Platform.TEST`:
    *   A standard JavaScript `prompt()` dialog appears.
    *   It asks the user to confirm (`Y`), fail (`E`), or cancel.
    *   **"Y"**: Simulates approval -> triggers `.approved()` listener.
    *   **"E"**: Simulates failure -> triggers global `store.error()` handler.
    *   **Cancel/Other**: Simulates cancellation -> triggers `.cancelled()` listener.
*   **Promise Handling (Lines 15-28):** The promise returned by `order()` resolves/rejects quickly after the prompt is dismissed, mainly indicating if the *request* was initiated or immediately failed/cancelled. The final purchase *outcome* is handled by the event listeners.

This setup allows you to test the full client-side purchase lifecycle locally using simple prompts for interaction. Remember to replace the Test platform logic with real platform adapters and server-side validation for production.

