# Subscription on Google Play

This use case explains how to implement an auto-renewing subscription on Android using Google Play.

!INCLUDE "../sections/setup-googleplay.md"

## Initialization

We use the generic subscription initialization structure. Reliable status tracking **requires a server-side validator** communicating with the Google Play Developer API.

!INCLUDE "../sections/subscription-generic-initialization.md"

```javascript
// --- Specific Implementations for Subscription Status ---

// Re-register product with correct platform
function initStore() {
    const { store, ProductType, Platform } = CdvPurchase;
    // ... other init steps from included file, excluding the generic registration...

    store.register({
        id: 'subscription1_gp', // Use your actual Google Play Subscription ID
        type: ProductType.PAID_SUBSCRIPTION,
        platform: Platform.GOOGLE_PLAY
    });

    // *** Setup Validator (REQUIRED for subscriptions) ***
    store.validator = "YOUR_VALIDATOR_URL"; // Or use Iaptic helper
    // store.validator = new CdvPurchase.Iaptic({...}).validator;

    // ... rest of initStore from included file (event listeners, initialize call) ...
}

// This function updates the UI based on verified subscription status
function renderUI() {
    const messagesEl = document.getElementById('messages');
    const statusEl = document.getElementById('subscription-status');
    if (!messagesEl || !statusEl) return;

    messagesEl.textContent = 'Store ready.'; // Clear status

    // ** Check ownership using store.owned() which relies on verified receipts **
    const isActive = CdvPurchase.store.owned('subscription1_gp'); // Use your Subscription ID

    if (isActive) {
        const purchase = CdvPurchase.store.findInVerifiedReceipts({ id: 'subscription1_gp' }); // Find the verified purchase details
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
        // Unlock premium features
    } else {
        statusEl.textContent = 'Subscription: Inactive';
        // Lock premium features
    }

    // Re-render product display
    const product = CdvPurchase.store.get('subscription1_gp');
    if (product) renderProduct(product); // Assumes renderProduct is defined in the included section
}

// --- Ensure required functions are available ---
// These should be defined in the included generic section or here.
// function renderProduct(product) { ... } // Included & needs Manage button logic
// function requestPurchase(platform, productId, offerId) { ... } // Included
// function manageSubscription(platform) { ... } // Included
// function updateMessages(text) { ... } // Included
// function log(msg) { ... } // Included

// --- Final Setup ---
document.addEventListener('deviceready', renderUI, false);
```

## Purchase & Validation Flow

1.  **Validation is Mandatory:** Set up `store.validator`.
2.  **Order:** User initiates purchase via `offer.order()`.
3.  **Approval:** `approved` event fires, call `transaction.verify()`.
4.  **Verification:** Validator communicates with Google Play Developer API.
5.  **Verification Response:** `verified` event fires with authoritative status (active, expired, grace period, etc.) and `expiryDate`.
6.  **Entitlement:** `renderUI` checks `store.owned()` based on verified data.
7.  **Finish:** `receipt.finish()` acknowledges the purchase to Google Play.

## Android Specific Notes

!INCLUDE "../sections/subscription-android.md"