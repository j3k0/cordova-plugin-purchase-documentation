### Initialization

Let's set up the basic HTML and JavaScript structure.

**HTML (`index.html` body):**

```html
<body>
  <div class="app">
    <!-- Status messages will go here -->
    <div id="messages">Loading...</div>
    <!-- Product details and purchase button -->
    <div id="product-details">Please wait...</div>
  </div>
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
```

**JavaScript (`index.js` or equivalent):**

```javascript
document.addEventListener('deviceready', initStore, false);

// Placeholder Product ID - REPLACE THIS with your actual Product ID
const MY_PRODUCT_ID = 'nonconsumable1';

function initStore() {

    const { store, ProductType, Platform, ErrorCode } = CdvPurchase;

    if (!store) { // Ensure the store object is available
        log('Store not available');
        return;
    }

    // Log all errors
    store.error(error => {
        log('ERROR ' + error.code + ': ' + error.message);
        updateMessages('Error: ' + error.message);
    });

    // Register the non-consumable product
    store.register({
        id: MY_PRODUCT_ID,
        type: ProductType.NON_CONSUMABLE,
        platform: store.defaultPlatform() // Or specify Platform.APPLE_APPSTORE, Platform.GOOGLE_PLAY
    });

    // Setup the validator (RECOMMENDED)
    // store.validator = "YOUR_VALIDATOR_URL";
    // store.validator = new CdvPurchase.Iaptic({...}).validator;

    // Setup event listeners
    store.when()
      .productUpdated(renderProduct) // Render the product UI when its data is available/updated
      .approved(transaction => {
          log('Approved: ' + transaction.products[0].id);
          // If using validation:
          if (store.validator) {
              updateMessages('Purchase approved. Verifying...');
              transaction.verify();
          } else {
              // WARNING: No validation - insecure for non-consumables
              log('WARNING: Skipping receipt validation.');
              updateMessages('Purchase approved. Finishing...');
              grantEntitlement(transaction.products[0].id);
              transaction.finish();
          }
      })
      .verified(receipt => {
          log('Verified: ' + receipt.id);
          updateMessages('Purchase verified. Finishing...');
          // Grant entitlement based on the verified purchase
          receipt.collection.forEach(purchase => grantEntitlement(purchase.id));
          receipt.finish(); // IMPORTANT: Finish the transaction
      })
      .unverified(unverifiedReceipt => {
          log('Purchase not verified.');
          updateMessages('Purchase failed verification.');
          // Decide how to handle failed verification (e.g., deny entitlement, retry?)
      })
      .finished(transaction => {
          log('Finished: ' + transaction.transactionId);
          updateMessages('Purchase complete!');
          renderUI(); // Ensure UI reflects the final owned state
      });

    // Initialize the store
    updateMessages('Initializing Store...');
    store.initialize([store.defaultPlatform()])
      .then(() => {
          log('Store initialized');
          updateMessages('Store ready.');
          renderUI();
      });
}

// --- Placeholder Functions (Implement in your main use-case file) ---

function renderProduct(product) {
    // Find the element to update
    const el = document.getElementById('product-details');
    if (!el) return;

    // Basic rendering - customize this in your use-case file
    log('Rendering product: ' + product.id);
    let html = `<h3>${product.title}</h3><p>${product.description}</p>`;
    const offer = product.getOffer();
    if (offer) {
        html += `<p>Price: ${offer.pricingPhases[0].price}</p>`;
        if (offer.canPurchase) {
            html += `<button onclick="requestPurchase('${product.platform}', '${product.id}', '${offer.id}')">Buy</button>`;
        } else if (product.owned) {
            html += `<p>(Already Owned)</p>`;
        } else {
            html += `<p>(Cannot Purchase)</p>`;
        }
    } else {
        html += `<p>Loading price...</p>`;
    }
    el.innerHTML = html;
}

function renderUI() {
    // This function should update the overall UI based on ownership state.
    // Implement the specific logic in your main use-case file.
    log('Rendering main UI...');
    // Example: Check ownership and update a status message or unlock UI elements
    const owned = CdvPurchase.store.owned(MY_PRODUCT_ID);
    updateMessages(owned ? 'Product Owned' : 'Product Not Owned');
}

function grantEntitlement(productId) {
    // This function grants access to the purchased content/feature.
    // Implement the specific logic in your main use-case file.
    log('Granting entitlement for: ' + productId);
    // Example: Set a flag in secure storage, update user profile on backend, etc.
}

function requestPurchase(platform, productId, offerId) {
    // This function initiates the purchase flow.
    log(`Requesting purchase: ${platform}, ${productId}, ${offerId}`);
    const offer = CdvPurchase.store.get(productId, platform)?.getOffer(offerId);
    if (offer) {
        updateMessages('Initiating purchase...');
        offer.order().then(error => {
            if (error) {
                if (error.code === CdvPurchase.ErrorCode.PAYMENT_CANCELLED) {
                    updateMessages('Purchase cancelled.');
                } else {
                    updateMessages(`Purchase failed: ${error.message}`);
                }
            } else {
                // Purchase flow initiated, waiting for 'approved' or 'cancelled'/'failed'
                updateMessages('Purchase flow started...');
            }
        });
    } else {
        updateMessages('Offer not found for purchase.');
    }
}

function updateMessages(text) {
    // Helper to show status messages
    const el = document.getElementById('messages');
    if (el) el.textContent = text;
}

// Simple log function for the example
function log(msg) {
    console.log('[Store Init] ' + msg);
}

// Initial UI update on device ready
document.addEventListener('deviceready', renderUI, false);

```