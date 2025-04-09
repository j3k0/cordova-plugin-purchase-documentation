### Purchase Flow (Android/Google Play Subscription)

This section details the purchase logic for **auto-renewing subscriptions** on **Android using Google Play**, assuming you have completed the [generic subscription initialization](sections/subscription-generic-initialization.md). Handling subscriptions reliably requires verification and **acknowledgment** via `transaction.finish()`.

**Step 1: Implement the Subscription Purchase Action (`subscribe`)**

*   **What:** Replace the placeholder `window.subscribe` function (from the generic initialization) to call `offer.order()` specifically for the Google Play platform. Include logic for handling potential subscription upgrades or downgrades using `additionalData`.
*   **Why:** This initiates the subscription purchase or change flow via the Google Play Billing library when the user clicks the "Subscribe" or "Switch Plan" button.

Replace the placeholder `window.subscribe` function in `www/js/index.js`:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.subscribe = function(productId, platform, offerId) {
    console.log(`Subscribe button clicked for ${productId}, offer ${offerId} on ${platform}`);
    const { store, Platform, ProductType, GooglePlay } = CdvPurchase; // Get necessary enums

    // Ensure we're acting on the correct platform
    if (platform !== Platform.GOOGLE_PLAY) {
        console.error("This function is currently specific to Google Play!");
        return;
    }

    const product = store.get(productId, Platform.GOOGLE_PLAY);
    const offer = product?.getOffer(offerId);

    if (offer) {
        console.log(`Initiating order for offer: ${offer.id} on platform ${offer.platform}`);
        setStatus('Initiating subscription...');

        // --- Prepare Additional Data for Google Play ---
        // This is crucial for upgrades/downgrades within the same group.
        const additionalData = {
            googlePlay: {
                // Optional: Provide obfuscated user identifiers for fraud prevention
                // accountId: store.getApplicationUsername() ? Utils.md5(store.getApplicationUsername()) : undefined,
                // profileId: '...' // If using multiple profiles per account

                // --- Subscription Update Parameters ---
                // The plugin attempts to find the 'oldPurchaseToken' automatically
                // if the new product is in the same 'group' as an owned one.
                // You can override or provide it manually if needed.
                // oldPurchaseToken: 'EXISTING_PURCHASE_TOKEN_TO_REPLACE',

                // Specify how the subscription change should occur.
                // Default is typically IMMEDIATE_WITH_TIME_PRORATION if oldPurchaseToken is set.
                // replacementMode: GooglePlay.ReplacementMode.DEFERRED, // Example: Change takes effect at next renewal
            }
        };

        // Automatically find old token if applicable (common use case)
        const oldToken = store.findOldPurchaseToken(productId, product?.group);
        if (oldToken && !additionalData.googlePlay.oldPurchaseToken) {
            console.log(`Found existing subscription in group '${product?.group}'. Setting oldPurchaseToken for upgrade/downgrade.`);
            additionalData.googlePlay.oldPurchaseToken = oldToken;
            // You might set a default replacementMode here if desired, e.g.:
            // additionalData.googlePlay.replacementMode = GooglePlay.ReplacementMode.WITH_TIME_PRORATION;
        }

        offer.order(additionalData)
            .then(result => {
                // Promise resolves when the Google Play UI is dismissed.
                if (result && result.isError) {
                    setStatus(`Subscription failed: ${result.message}`);
                } else {
                    // Purchase flow started... status updated by listeners.
                }
                refreshUI();
            })
            .catch(err => {
                 console.error("Unexpected error during subscription order:", err);
                 setStatus('Unexpected error during subscription.');
                 refreshUI();
            });

    } else {
        console.error(`Cannot subscribe: Product (${productId}) or Offer (${offerId}) not found.`);
        setStatus('Error: Unable to subscribe. Product details missing.');
    }
}

// Helper function (ensure this exists or add it)
CdvPurchase.Store.prototype.findOldPurchaseToken = function(newProductId, group) {
    if (!group) return undefined;
    const potentialOldPurchase = this.verifiedPurchases.find(p => {
        const pProduct = this.get(p.id, p.platform);
        // Find an active, verified subscription in the same group, but not the one being purchased.
        return p.platform === Platform.GOOGLE_PLAY
            && pProduct?.type === ProductType.PAID_SUBSCRIPTION
            && pProduct?.group === group
            && p.id !== newProductId
            && !p.isExpired;
    });
    return potentialOldPurchase?.purchaseId; // purchaseId holds the purchaseToken on Google Play
}
```
*   **Explanation:**
    *   We retrieve the specific `offer` to purchase.
    *   We prepare `additionalData.googlePlay`. The `oldPurchaseToken` is needed when changing subscriptions within the same group. The plugin includes a helper `findOldPurchaseToken` to find the relevant token automatically if products are correctly grouped during registration.
    *   `replacementMode` controls how the subscription change takes effect (immediately with proration, at next renewal, etc.). See [Google Play Replacement Modes](https://developer.android.com/google/play/billing/subscriptions#replacement-modes).
    *   `offer.order(additionalData)` initiates the flow.

**Step 2: Handle Purchase Events (`.approved`, `.verified`, `.finished`)**

*   **What:** Add the subscription purchase lifecycle event listeners within the `store.when()` chain in your `initializeStoreAndSetupListeners` function.
*   **Why:** These listeners handle the progression: approval by Google Play, mandatory verification via your validator (which communicates with the Google Play Developer API), and mandatory acknowledgment via `finish()`.

Add these handlers inside the existing `store.when()` call:

```javascript
// Inside initializeStoreAndSetupListeners() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);
        setStatus('Purchase approved. Verifying...');

        // Verification is REQUIRED for subscriptions on Android to get accurate status.
        if (store.validator) {
            transaction.verify(); // Initiate verification
        } else {
             console.error("VALIDATOR REQUIRED: Cannot reliably manage subscriptions without receipt validation.");
             setStatus("ERROR: Validator not configured.");
             // Do NOT finish the transaction here without validation.
        }
    })
    .verified(receipt => {
        console.log(`Receipt verified, contains ${receipt.collection.length} verified purchases.`);
        setStatus('Purchase verified. Finishing...');

        // The verified receipt contains the authoritative status from Google Play Developer API.
        // The refreshUI() function (called below) should use store.verifiedPurchases or store.owned()
        // to update the UI based on this validated data.

        // Finish (acknowledge) the transaction(s) in the receipt with Google Play.
        // This is MANDATORY within 3 days for subscriptions.
        console.log(`Finishing verified receipt's source transaction(s): ${receipt.sourceReceipt.transactions.map(t=>t.transactionId).join(', ')}`);
        receipt.finish();
    })
    .finished(transaction => {
        // This confirms the acknowledgement call was successful.
        console.log(`Transaction ${transaction.transactionId} finished (acknowledged) for ${transaction.products[0]?.id}.`);
        setStatus('Subscription active!');
        // Subscription state should reflect verified data. Refresh UI to be sure.
        refreshUI();
    })
    .cancelled(transaction => {
        console.log('Purchase Cancelled:', transaction.transactionId);
        setStatus('Purchase cancelled.');
        refreshUI();
    });
    // Ensure the .productUpdated, .receiptUpdated listeners from the generic setup are still present
```
*   **Explanation:**
    *   `.approved()`: Triggers `transaction.verify()`. Validation is essential.
    *   `.verified()`: The receipt is validated. The UI should be updated based on this (`refreshUI()` is called). Crucially, `receipt.finish()` is called to acknowledge the purchase with Google Play.
    *   `.finished()`: Confirms acknowledgment. Update UI.

---

**Build and Test (Android/Google Play Subscription)**

Testing subscriptions on Google Play requires using testing tracks and specific procedures:

1.  **Create Release Build:** Sign your APK/AAB with your **release keystore**.
2.  **Upload to Play Console:** Upload the build to **Internal testing** or **Closed testing**.
3.  **Validator Setup:** Ensure your `store.validator` is configured and your validation server is connected to the **Google Play Developer API** using a Service Account key. This is mandatory for getting correct subscription status. See [Setup Guide - Step 9](sections/setup-subscription-android-9-validation-server.md).
4.  **Add Testers:** Add your tester Google accounts to the License Testing list and the specific testing track in the Play Console.
5.  **Prepare Test Device:** Use a physical device logged in **only** with a tester Google account. Install the app **from the Google Play Store** via the test link/invitation.
6.  **Run & Monitor:** Launch the app, monitor logs with `adb logcat CordovaPurchase:V CordovaLog:V chromium:D *:S`.
7.  **Test Subscription Purchase:**
    *   Verify UI shows "Subscription: Inactive" initially, product details load.
    *   Tap "Subscribe".
    *   The Google Play purchase sheet appears, mentioning test purchase behavior (e.g., short renewal cycles like 5 minutes). Confirm the purchase.
    *   Observe logs: `approved`, `Verification required...`, `Receipt verified...`, `Finishing...`, `finished`.
    *   The UI (`refreshUI`) should update based on the `verified` event data, showing "Subscription: ACTIVE" with the correct expiry date from the validator.
8.  **Test Renewals:** Keep the app running or reopen it around the renewal time (e.g., after 5 minutes for test subscriptions). Observe new `approved` -> `verified` -> `finished` cycles in the logs as the subscription auto-renews in the test environment. The expiry date in the UI should update.
9.  **Test Management:** Use `store.manageSubscriptions()` to open the Google Play subscription center. Test cancelling the subscription. After cancellation, `store.update()` or the next renewal attempt should reflect the change (e.g., `renewalIntent` becomes `LAPSE` in the `VerifiedPurchase` data from the validator).

---

This covers the Android subscription flow. Key points are the necessity of a **validator connected to the Google Play Developer API** and **acknowledging** purchases via `transaction.finish()`.
