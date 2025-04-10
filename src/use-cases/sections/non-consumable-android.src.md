### Purchase Flow (Android/Google Play Non-Consumable)

This section details the purchase logic specific to **Android/Google Play** for **non-consumable** items (like unlocking a feature permanently). The key step on Android is **acknowledging** the purchase within 3 days using `transaction.finish()` to prevent automatic refunds.

**Step 1: Implement the Purchase Action (`purchaseFeature`)**

*   **What:** Replace the placeholder `window.purchaseFeature` function (from the generic initialization) to call `offer.order()` specifically for the Google Play platform.
*   **Why:** This triggers the Google Play purchase dialog when the user clicks the "Unlock Now!" button.

Replace the placeholder `window.purchaseFeature` function in `www/js/index.js`:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.purchaseFeature = function() {
    const productId = 'unlock_premium_feature'; // Use the SAME product ID you registered
    console.log(`Purchase button clicked for non-consumable: ${productId}`);
    const { store, Platform } = CdvPurchase;

    // Get the product specifically for Google Play
    const product = store.get(productId, Platform.GOOGLE_PLAY);
    const offer = product?.getOffer(); // Get the default offer

    if (offer) {
        console.log(`Initiating order for non-consumable offer: ${offer.id} on platform ${offer.platform}`);
        setStatus('Initiating purchase...');

        // Optional: Add obfuscated account/profile IDs for fraud prevention
        // const additionalData = { googlePlay: { accountId: 'hashed_user_id' } };
        // offer.order(additionalData)
        offer.order()
            .then(result => {
                // Promise resolves when the Google Play UI is dismissed.
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
*   **Why:** These listeners handle the progression of the purchase: approval by Google Play, optional verification, and mandatory acknowledgment.

Add these handlers inside the existing `store.when()` call:

```javascript
// Inside initializeStoreAndSetupListeners() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);
        setStatus('Purchase approved. Verifying...');

        // Verification is highly recommended for non-consumables to prevent fraud.
        if (store.validator) {
            transaction.verify();
        } else {
             console.warn("Receipt validator not configured. Granting entitlement and acknowledging purchase without server verification (INSECURE).");
             // Grant entitlement and acknowledge directly if no validator.
             acknowledgeFeatureAndFinish(transaction);
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
            // and ACKNOWLEDGE the transaction
            acknowledgeFeatureAndFinish(verifiedTransaction);
        } else {
            console.error("Verified receipt didn't contain the expected non-consumable transaction?");
            // Finish anyway to clear the queue if possible
            receipt.finish();
        }
    })
    .finished(transaction => {
        // This confirms the acknowledgement call was successful.
        console.log(`Transaction ${transaction.transactionId} finished (acknowledged) for ${transaction.products[0]?.id}.`);
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

**Step 3: Implement Feature Unlock and Acknowledge Logic (`acknowledgeFeatureAndFinish`)**

*   **What:** Replace the placeholder `grantEntitlement` function with `acknowledgeFeatureAndFinish`. This function updates your app's state (e.g., `localStorage` - **use secure storage in production!**) to unlock the feature and then calls `transaction.finish()` to **acknowledge** the purchase with Google Play.
*   **Why:** You **must** acknowledge non-consumable purchases on Google Play within 3 days, otherwise Google will automatically refund the user and revoke the entitlement. Calling `transaction.finish()` performs this acknowledgment. **Do not consume non-consumables.**

Replace the placeholder `grantEntitlement` function in `www/js/index.js` with this:

```javascript
// In js/index.js

// Replace the placeholder grantEntitlement function
function acknowledgeFeatureAndFinish(transaction) {
    const productId = transaction.products[0]?.id;
    if (productId !== MY_NON_CONSUMABLE_ID) return; // Ensure it's the correct product

    // Grant the entitlement if not already granted
    // Check your persistent storage method here
    const isUnlocked = isFeatureUnlocked(); // Assumes function from generic init exists

    if (isUnlocked) {
        console.log(`Feature already unlocked, acknowledging transaction ${transaction.transactionId} again just in case.`);
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

    // Acknowledge the purchase with Google Play.
    // This is CRUCIAL for non-consumables on Android to prevent refunds.
    // It tells Google you have successfully processed the purchase.
    if (!transaction.isAcknowledged) {
        console.log(`Acknowledging (finishing) transaction ${transaction.transactionId}...`);
        transaction.finish();
    } else {
        console.log(`Transaction ${transaction.transactionId} already acknowledged.`);
    }
}
```

---

**Build and Test (Android/Google Play Non-Consumable)**

Testing Google Play In-App Purchases requires specific steps:

1.  **Create a Release Build:**
    *   Google Play Billing generally requires **release-signed APKs/AABs** for testing. Debug builds often fail.
    *   Generate a Java Keystore if you don't have one (`keytool ...`). **Back it up securely!**
    *   Build the signed release APK/AAB using your release key (e.g., via `cordova build android --release -- --keystore=... --alias=...` or a build script).

2.  **Upload to Google Play Console:**
    *   Navigate to your app in the Play Console.
    *   Go to **Release -> Testing -> Internal testing** (or Closed/Open testing).
    *   Create a new release and **upload the signed release build**.
    *   Add your tester Google account email addresses to the tester list for that track.
    *   **Save and roll out** the release. Wait for it to become available (can take minutes to hours).

3.  **Prepare Test Device:**
    *   Use a **physical Android device**. Emulators can be unreliable.
    *   Log into the device **only** with a Google account listed as a tester for your app's track. Remove other Google accounts temporarily if needed.
    *   Ensure the Google Play Store app is up-to-date.

4.  **Install and Run:**
    *   Testers must **accept the testing invitation** (usually via a Play Store link).
    *   Install the app **from the Google Play Store** using the testing link. Installing manually via `adb` often bypasses necessary Play Store setup.
    *   Open the app.
    *   Monitor logs using `adb logcat CordovaPurchase:V CordovaLog:V chromium:D *:S`.

5.  **Test the Purchase:**
    *   Navigate to where the non-consumable product is offered.
    *   **Verify Initial State:** Logs should show store initialization. UI should show the feature as "Locked" and the product details (title, price) with the "Unlock Now!" button should be visible.
    *   **Tap "Unlock Now!"**.
    *   The Google Play purchase sheet should appear, likely mentioning "Test card, always approves".
    *   **Confirm** the purchase.
    *   **Observe Logs and UI:**
        *   `approved` event log.
        *   `(If validator set)` `verified` event log.
        *   `Unlocking feature...` log from `acknowledgeFeatureAndFinish`.
        *   `Acknowledging (finishing) transaction...` log.
        *   `finished` event log.
    *   The UI should update to show "Premium Feature: Unlocked! 🎉".
    *   The "Unlock Now!" button should be replaced with "(Already Purchased)".
    *   **Restart the app:** Verify the unlocked status persists (reads from your storage mechanism) and the purchase button remains disabled.
    *   **Attempt Repurchase:** Tapping where the button was should do nothing, or trying to trigger the purchase again should ideally fail or be blocked by your UI logic based on the `owned` status.

---

This completes the non-consumable purchase flow for Android. The key takeaway is the necessity of **acknowledging** the purchase using `transaction.finish()` to prevent automatic refunds by Google Play.
