### Purchase Flow (iOS/App Store Non-Consumable)

This section details the purchase logic specific to **iOS/App Store** for **non-consumable** items (like unlocking a feature permanently), assuming you have completed the [generic non-consumable initialization](non-consumable-generic-initialization.md). Similar to Android, the purchase must be finalized using `transaction.finish()` to remove it from the payment queue.

**Step 1: Implement the Purchase Action (`purchaseFeature`)**

*   **What:** Replace the placeholder `window.purchaseFeature` function (from the generic initialization) to call `offer.order()` specifically for the App Store platform.
*   **Why:** This triggers the App Store purchase dialog when the user clicks the "Unlock Now!" button.

Replace the placeholder `window.purchaseFeature` function in `www/js/index.js`:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.purchaseFeature = function() {
    const productId = 'unlock_premium_feature'; // Use the SAME product ID you registered
    console.log(`Purchase button clicked for non-consumable: ${productId}`);
    const { store, Platform } = CdvPurchase;

    // Get the product specifically for AppStore
    const product = store.get(productId, Platform.APPLE_APPSTORE);
    const offer = product?.getOffer(); // Get the default offer

    if (offer) {
        console.log(`Initiating order for non-consumable offer: ${offer.id} on platform ${offer.platform}`);
        setStatus('Initiating purchase...');

        offer.order()
            .then(result => {
                // Promise resolves when the App Store sheet is dismissed.
                // Outcome is handled by listeners.
                if (result && result.isError) {
                    setStatus(`Order failed: ${result.message}`);
                } else {
                    // Purchase flow started... status updated by listeners.
                }
                refreshUI(); // Refresh UI in case button state needs update
            })
            .catch(err => {
                 console.error("Unexpected error during non-consumable order:", err);
                 setStatus('Unexpected error during purchase.');
                 refreshUI();
            });

    } else {
        console.error(`Cannot purchase feature: Product (${productId}) or offer not found.`);
        setStatus('Error: Unable to purchase. Product details missing.');
    }
}
```

**Step 2: Handle Purchase Events (`.approved`, `.verified`, `.finished`)**

*   **What:** Add the purchase lifecycle event listeners within the `store.when()` chain in your `initializeStoreAndSetupListeners` function (created during generic initialization).
*   **Why:** These listeners handle the progression of the purchase: approval by App Store, optional but recommended verification, and mandatory finalization.

Add these handlers inside the existing `store.when()` call:

```javascript
// Inside initializeStoreAndSetupListeners() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);
        setStatus('Purchase approved. Verifying...');

        // Verification is highly recommended for non-consumables.
        if (store.validator) {
            transaction.verify();
        } else {
             console.warn("Receipt validator not configured. Granting entitlement and finishing purchase without server verification (INSECURE).");
             // Grant entitlement and finish directly if no validator.
             unlockFeatureAndFinish(transaction);
        }
    })
    .verified(receipt => {
        console.log(`Receipt verified for transaction ${receipt.transactions[0]?.transactionId}`);
        setStatus('Purchase verified. Finishing...');

        // Find the relevant transaction within the verified receipt
        const verifiedTransaction = receipt.transactions
            .find(t => t.products[0]?.id === MY_NON_CONSUMABLE_ID); // Use your product ID

        if (verifiedTransaction) {
            // Grant entitlement (if not already done based on verified data)
            // and FINISH the transaction
            unlockFeatureAndFinish(verifiedTransaction);
        } else {
            console.error("Verified receipt didn't contain the expected non-consumable transaction?");
            // Finish anyway to clear the queue if possible
            receipt.finish();
        }
    })
    .finished(transaction => {
        // This confirms the finish() call was successful.
        console.log(`Transaction ${transaction.transactionId} finished for ${transaction.products[0]?.id}.`);
        setStatus('Purchase complete! Feature unlocked.');
        // Feature should already be unlocked. Refresh UI to be sure.
        refreshUI();
    })
    .cancelled(transaction => {
        console.log('Purchase Cancelled:', transaction.transactionId);
        setStatus('Purchase cancelled.');
        refreshUI();
    });
    // Ensure the .productUpdated, .receiptUpdated listeners from the generic setup are still present
```

**Step 3: Implement Feature Unlock and Finish Logic (`unlockFeatureAndFinish`)**

*   **What:** Replace the placeholder `grantEntitlement` function with `unlockFeatureAndFinish`. This function updates your app's state (e.g., `localStorage` - **use secure storage in production!**) to unlock the feature and then calls `transaction.finish()`.
*   **Why:** You **must** call `transaction.finish()` for non-consumable purchases on iOS to remove them from the payment queue. This acknowledges to the App Store that you have processed the transaction.

Replace the placeholder `grantEntitlement` function in `www/js/index.js` with this:

```javascript
// In js/index.js

// Replace the placeholder grantEntitlement function
function unlockFeatureAndFinish(transaction) {
    const productId = transaction.products[0]?.id;
    if (productId !== MY_NON_CONSUMABLE_ID) return; // Ensure it's the correct product

    // Grant the entitlement if not already granted
    // Check your persistent storage method here
    const isUnlocked = isFeatureUnlocked(); // Assumes function from generic init exists

    if (isUnlocked) {
        console.log(`Feature already unlocked, finishing transaction ${transaction.transactionId} again just in case.`);
    } else {
        console.log(`Unlocking feature for transaction ${transaction.transactionId}...`);
        // Persist the unlock status SECURELY
        try {
            window.localStorage.setItem(FEATURE_KEY, 'YES'); // INSECURE EXAMPLE - Use SecureStorage
            console.log('Ownership flag set in localStorage.');
        } catch (e) {
            console.error('Error saving ownership to localStorage:', e);
        }
        // Refresh the UI immediately to show the unlocked state
        refreshUI();
        // Optionally show a confirmation message
        // alert('Feature Unlocked! Thank you.');
    }

    // Finish the transaction!
    // This acknowledges the purchase with the App Store and removes it from the queue.
    // Required for non-consumables and subscriptions on iOS.
    if (transaction.state !== TransactionState.FINISHED) {
        console.log(`Finishing transaction ${transaction.transactionId}...`);
        transaction.finish();
    } else {
        console.log(`Transaction ${transaction.transactionId} already finished.`);
    }
}
```

---

**Build and Test (iOS/App Store Non-Consumable)**

Follow the standard iOS testing procedure:

1.  **Prepare:** `cordova prepare ios`.
2.  **Open:** `open platforms/ios/*.xcodeproj` (or `.xcworkspace`).
3.  **Configure Xcode:** Set signing team, select your physical test device. Ensure "In-App Purchase" capability is enabled.
4.  **Prepare Sandbox Tester:** On your test device, go to `Settings -> App Store`, scroll down, and **Sign Out** of any production Apple ID. Do **not** sign into the Sandbox account here.
5.  **Run:** Build and run the app from Xcode (▶) onto your device.
6.  **Test Purchase:**
    *   Verify initial UI shows the feature as "Locked" and the product details with the "Unlock Now!" button.
    *   Tap "Unlock Now!".
    *   The App Store purchase sheet appears. **Sign in** using your **Sandbox Tester** credentials when prompted.
    *   Confirm the purchase (it will indicate "[Environment: Sandbox]").
    *   Observe Xcode console logs: `approved`, `verified` (if validator set), `Unlocking feature...`, `Finishing transaction...`, `finished`.
    *   The UI should update to show "Premium Feature: Unlocked! 🎉".
    *   The "Unlock Now!" button should be replaced with "(Already Purchased)".
    *   **Restart the app:** Verify the unlocked status persists and the purchase button remains disabled.
    *   **Restore Purchases:** Add a "Restore Purchases" button that calls `store.restorePurchases()`. Test that after restoring, the UI correctly reflects the owned status.

---

This completes the non-consumable purchase flow for iOS/App Store. The key is calling `transaction.finish()` after granting the entitlement to acknowledge the purchase with Apple.