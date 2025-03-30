# Subscription on AppStore

This use case explains how to implement an auto-renewing subscription on iOS using the App Store.


## Initialization

We use the generic subscription initialization structure. The core logic for checking ownership and rendering the UI relies heavily on **verified receipt data** because local information about subscription status and expiry is unreliable on iOS.


```javascript
// --- Specific Implementations for Subscription Status ---

// This function updates the UI based on verified subscription status
function renderUI() {
    const messagesEl = document.getElementById('messages');
    const statusEl = document.getElementById('subscription-status');
    if (!messagesEl || !statusEl) return;

    messagesEl.textContent = 'Store ready.'; // Clear status

    // ** Check ownership using store.owned() which relies on verified receipts **
    const isActive = CdvPurchase.store.owned('subscription1'); // Use your actual Subscription ID

    if (isActive) {
        const purchase = CdvPurchase.store.findInVerifiedReceipts({ id: 'subscription1' }); // Find the verified purchase details
        let statusText = 'Subscription: ACTIVE';
        if (purchase?.expiryDate) {
            const dateStr = new Date(purchase.expiryDate).toLocaleDateString();
            statusText += ` (Renews/Expires: ${dateStr})`;
        }
        // Check for potential issues flagged by the validator
        if (purchase?.renewalIntent === CdvPurchase.RenewalIntent.LAPSE) {
            statusText += ' <span style="color:orange;">[Will Expire]</span>';
        }
        if (purchase?.isBillingRetryPeriod) {
            statusText += ' <span style="color:red;">[Billing Issue!]</span>';
        }
        statusEl.innerHTML = statusText;
        // Unlock premium features in your app
    } else {
        statusEl.textContent = 'Subscription: Inactive';
        // Lock premium features
    }

    // Re-render product display to update purchase/manage buttons
    const product = CdvPurchase.store.get('subscription1');
    if (product) renderProduct(product);
}

// --- Ensure required functions are available ---
// These should be defined in the included generic section or here.

// function renderProduct(product) { ... } // Included & Modified above for Manage button
// function requestPurchase(platform, productId, offerId) { ... } // Included
// function manageSubscription(platform) { ... } // Included
// function updateMessages(text) { ... } // Included
// function log(msg) { ... } // Included

// --- Final Setup ---

// Initial UI render on device ready depends on validated data,
// so we mostly rely on the callbacks from initStore.
document.addEventListener('deviceready', () => {
    updateMessages('Checking subscription status...');
    // Initial renderUI might show "Inactive" until verification completes.
    renderUI();
}, false);
```

## Purchase & Validation Flow

The core logic is in the included generic section. For subscriptions:

1.  **Validation is Mandatory:** You **must** set up `store.validator`. The `approved` event triggers `transaction.verify()`.
2.  **Grant Entitlement on Verification:** The `verified` event receives the validated receipt. The `renderUI` function (called from `finished` or `productUpdated`/`receiptUpdated` listeners) checks `store.owned()` based on this verified data to unlock/lock features.
3.  **Finish Transaction:** `receipt.finish()` is called after verification to acknowledge the transaction to Apple.

## iOS Specific Notes

