### Purchase Flow (iOS/App Store Subscription)

This section details the purchase logic for **auto-renewing subscriptions** on **iOS/App Store**. Handling subscriptions reliably requires verification and **acknowledgment** via `transaction.finish()`.

**Step 1: Implement the Subscription Purchase Action (`subscribe`)**

*   **What:** Replace the placeholder `window.subscribe` function (from the generic initialization) to call `offer.order()` specifically for the App Store platform.
*   **Why:** This initiates the subscription purchase flow via StoreKit when the user clicks the "Subscribe" or "Switch Plan" button.

Replace the placeholder `window.subscribe` function in `www/js/index.js`:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.subscribe = function(productId, platform, offerId) {
    console.log(`Subscribe button clicked for ${productId}, offer ${offerId} on ${platform}`);
    const { store, Platform, ProductType } = CdvPurchase;

    // Ensure we're acting on the correct platform
    if (platform !== Platform.APPLE_APPSTORE) {
        console.error("This function is currently specific to AppStore!");
        return;
    }

    const product = store.get(productId, Platform.APPLE_APPSTORE);
    const offer = product?.getOffer(offerId); // Get the specific offer

    if (offer) {
        console.log(`Initiating order for offer: ${offer.id} on platform ${offer.platform}`);
        setStatus('Initiating subscription...');

        // Optional: Pass applicationUsername for tracking/linking on your server
        // const additionalData = { applicationUsername: 'hashed_user_id_or_uuid' };
        // offer.order(additionalData)

        // Optional: Pass discount details if ordering a promotional offer
        // const discountData = { appStore: { discount: { id: 'promoId', key: '...', nonce: '...', signature: '...', timestamp: '...' } } };
        // offer.order(discountData)

        offer.order()
            .then(result => {
                // Promise resolves when the App Store sheet is dismissed.
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
```
*   **Explanation:**
    *   We retrieve the specific `offer` to purchase.
    *   `offer.order()` initiates the flow.
    *   `additionalData` can be used to pass `applicationUsername` or promotional offer `discount` details if needed.

**Step 2: Handle Purchase Events (`.approved`, `.verified`, `.finished`)**

*   **What:** Add the subscription purchase lifecycle event listeners within the `store.when()` chain in your `initializeStoreAndSetupListeners` function.
*   **Why:** These listeners handle the progression: approval by App Store, mandatory verification via your validator, and mandatory acknowledgment via `finish()`.

Add these handlers inside the existing `store.when()` call:

```javascript
// Inside initializeStoreAndSetupListeners() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);
        setStatus('Purchase approved. Verifying...');

        // Verification is REQUIRED for subscriptions to get accurate status from Apple's servers.
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

        // The verified receipt contains the authoritative status from App Store Server API.
        // The refreshUI() function (called below) should use store.verifiedPurchases or store.owned()
        // to update the UI based on this validated data.

        // Finish (acknowledge) the transaction associated with this receipt with the App Store.
        // This is MANDATORY for subscriptions.
        console.log(`Finishing verified receipt's source transaction: ${receipt.sourceReceipt.transactions[0]?.transactionId}`);
        receipt.finish();
    })
    .finished(transaction => {
        // This confirms the finish() call was successful.
        console.log(`Transaction ${transaction.transactionId} finished for ${transaction.products[0]?.id}.`);
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
    *   `.verified()`: The receipt is validated. The UI should be updated based on this (`refreshUI()` is called). Crucially, `receipt.finish()` is called to acknowledge the purchase with the App Store.
    *   `.finished()`: Confirms acknowledgment. Update UI.

---

**Build and Test (iOS/App Store Subscription)**

Testing subscriptions follows the standard iOS procedure, paying attention to renewals and management:

1.  **Prepare & Build:**
    *   Save changes.
    *   Run `cordova prepare ios`.
    *   Open the project in Xcode (`open platforms/ios/*.xcworkspace` or `.xcodeproj`).
2.  **Configure & Run in Xcode:**
    *   Set up signing (Team, Certificates).
    *   Select your **physical test device**. Simulators are unreliable for IAP.
    *   **Validator:** Ensure `store.validator` is configured and your server has the correct **App-Specific Shared Secret**. See [Setup Guide - Step 7](../setup/setup-appstore.md).
    *   **Sandbox Tester:** On the device, go to `Settings -> App Store`. Sign out of any production Apple ID. **Do not** sign in to the Sandbox account yet.
    *   Run the app from Xcode (▶).
3.  **Test Subscription Purchase:**
    *   Observe UI and Xcode console logs. Initial status should be "Subscription: Inactive". Product details should load.
    *   Tap the **"Subscribe"** button.
    *   The App Store purchase sheet appears. **Sign in** with your **Sandbox Tester** account when prompted.
    *   Confirm the subscription purchase (it will show "[Environment: Sandbox]").
    *   Observe logs: `approved`, `Verification required...`, `Receipt verified...`, `Finishing...`, `finished`.
    *   The UI (`refreshUI`) should update based on the `verified` event data, showing "Subscription: ACTIVE" with the expiry date from the validator.
4.  **Test Renewals (Sandbox):**
    *   Sandbox subscriptions renew quickly (e.g., a 1-month sub renews every ~5 minutes).
    *   Keep the app running or reopen it after the renewal time.
    *   Observe new `approved` -> `verified` -> `finished` cycles in the logs. The expiry date in the UI should update after verification.
5.  **Test Management:**
    *   Tap the "Manage Subscription" button (rendered by `refreshUI`).
    *   This opens the system's Sandbox subscription management UI. Test changing plans (if you have groups) or cancelling.
    *   After making changes, call `store.update()` or wait for the next renewal cycle; the changes should reflect in the `VerifiedPurchase` data after validation.

---

This completes the subscription purchase flow for iOS/App Store. Accurate status relies heavily on the configured receipt validator. Remember to call `transaction.finish()` after successful verification.
