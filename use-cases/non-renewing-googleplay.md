# Non-Renewing Subscription with Google Play

This use case explains how to implement a non-renewing subscription on Android using Google Play. Non-renewing subscriptions grant access for a fixed duration and need to be repurchased manually by the user.


## Initialization

We adapt the generic subscription initialization. The key difference is handling the `ProductType.NON_RENEWING_SUBSCRIPTION` and managing the expiry date, which *might* be available locally on Android but is more reliably tracked via a validation server.


```javascript
// --- Specific Implementations for Non-Renewing Subscription Status ---

// Placeholder Product ID - REPLACE THIS
const MY_NON_RENEWING_ID = 'non_renewing_1_month';

// Re-register with the correct type
function initStore() {
    const { store, ProductType, Platform } = CdvPurchase;
    // ... other init steps from included file ...

    store.register({
        id: MY_NON_RENEWING_ID,
        type: ProductType.NON_RENEWING_SUBSCRIPTION, // Set correct type
        platform: Platform.GOOGLE_PLAY
    });

    // *** Setup Validator (RECOMMENDED for reliable expiry tracking) ***
    // store.validator = "YOUR_VALIDATOR_URL";
    // ... rest of initStore ...
}

// Update UI rendering for non-renewing specifics
function renderProduct(product) {
    const el = document.getElementById('product-' + product.id);
    if (!el) return;
    log('Rendering product: ' + product.id);

    let html = `<h3>${product.title}</h3><p>${product.description}</p>`;
    const offer = product.getOffer();

    if (offer) {
        offer.pricingPhases.forEach(phase => {
            html += `<p>${phase.price} for ${CdvPurchase.Utils.formatDurationEN(phase.billingPeriod)}</p>`; // Non-renewing format
        });

        // Non-renewing can typically be purchased if not currently active (or allow stacking)
        if (offer.canPurchase || !product.owned) { // Check ownership too
            html += `<button onclick="requestPurchase('${product.platform}', '${product.id}', '${offer.id}')">Buy Access</button>`;
        } else if (product.owned) {
            html += `<p>(Currently Active)</p>`;
            // Optionally show expiry from verified data
            const purchase = CdvPurchase.store.findInVerifiedReceipts(product);
            if (purchase?.expiryDate) {
                 html += `<p>Expires: ${new Date(purchase.expiryDate).toLocaleDateString()}</p>`;
            }
             // No 'Manage Subscription' button for non-renewing
        } else {
            html += `<p>(Cannot Purchase)</p>`;
        }
    } else {
        html += `<p>Loading offer...</p>`;
    }
    el.innerHTML = html;
}

// Update overall UI based on non-renewing status
function renderUI() {
    const statusEl = document.getElementById('subscription-status'); // Reusing ID for simplicity
    if (!statusEl) return;
    log('Rendering main UI...');

    // ** Check ownership using store.owned() **
    // Relies on validator if set, otherwise less reliable local data
    const isActive = CdvPurchase.store.owned(MY_NON_RENEWING_ID);

    if (isActive) {
        const purchase = CdvPurchase.store.findInVerifiedReceipts({ id: MY_NON_RENEWING_ID });
        let statusText = 'Access Active';
        if (purchase?.expiryDate) {
            statusText += ` (Expires: ${new Date(purchase.expiryDate).toLocaleDateString()})`;
        } else {
             // Try local receipt if no validator or verified data is missing expiry
             const transaction = CdvPurchase.store.findInLocalReceipts({ id: MY_NON_RENEWING_ID });
             if (transaction?.expirationDate) {
                  statusText += ` (Expires: ${transaction.expirationDate.toLocaleDateString()} - Local Data)`;
             }
        }
        statusEl.textContent = statusText;
        // Unlock features
    } else {
        statusEl.textContent = 'Access Inactive';
        // Lock features
    }

    // Re-render product display
    const product = CdvPurchase.store.get(MY_NON_RENEWING_ID);
    if (product) renderProduct(product);
}

// --- Ensure required functions are available ---
// These might be included from the generic section or defined here.
// function grantEntitlement(productId) { ... } // Often not needed explicitly if UI just checks owned()
// function requestPurchase(platform, productId, offerId) { ... }
// function updateMessages(text) { ... }
// function log(msg) { ... }

// --- Final Setup ---
document.addEventListener('deviceready', renderUI, false);
```

## Purchase & Validation Flow

1.  **Order:** User purchases the non-renewing subscription via `offer.order()`.
2.  **Approval:** `approved` event fires.
3.  **Verification (Recommended):** `transaction.verify()` sends data to your validator. Your validator calculates the expiry date based on the purchase time and product duration.
4.  **Verification Response:** `verified` event fires. The `VerifiedPurchase` object from your validator should contain the calculated `expiryDate`.
5.  **Finish:** `receipt.finish()` acknowledges the purchase (marks as consumed/acknowledged).
6.  **Entitlement:** The `renderUI` function checks `store.owned(MY_NON_RENEWING_ID)`. The `owned()` method uses the `expiryDate` from the verified receipt (if available and validator is used) to determine if access is currently active.


## Android Specific Notes

