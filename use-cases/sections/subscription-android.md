### Purchase Flow (Android/Google Play Subscription)

This section details the purchase logic for auto-renewing subscriptions on Android using Google Play. Handling subscriptions reliably requires verification and acknowledgment.

**Step 1: Implement the Subscription Purchase Action**

*   **What:** Fill in the `window.subscribe` function (defined as a stub previously) to call `store.order()` with the selected offer and platform.
*   **Why:** This initiates the subscription purchase or upgrade/downgrade flow via the Google Play Billing library when the user clicks the "Subscribe" or "Switch Plan" button.

Replace the placeholder `window.subscribe` function in `www/js/index.js`:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.subscribe = function(productId, platform, offerId) {
    console.log(`Subscribe button clicked for ${productId}, offer ${offerId} on ${platform}`);
    const { store, Platform, ProductType } = CdvPurchase; // Get necessary enums

    // Ensure we're acting on the correct platform
    if (platform !== Platform.GOOGLE_PLAY) {
        console.error("This function is currently specific to Google Play!");
        return;
    }

    const product = store.get(productId, Platform.GOOGLE_PLAY);
    const offer = product?.getOffer(offerId);

    if (offer) {
        console.log(`Initiating order for offer: ${offer.id} on platform ${offer.platform}`);
        // Optional: Update UI to indicate processing
        // setState({ isPurchasing: true });

        // Prepare additional data for Google Play, especially for upgrades/downgrades
        const additionalData = {
            googlePlay: {
                // accountId: store.getApplicationUsername() ? Utils.md5(store.getApplicationUsername()) : undefined
                // Optional: Let the plugin find the old purchase token if products are grouped
                // Or specify manually if needed:
                // oldPurchaseToken: 'EXISTING_PURCHASE_TOKEN_IF_UPGRADING',
                // replacementMode: store.GooglePlay.ReplacementMode.CHARGE_PRORATED_PRICE // Example mode
            }
        };

        store.order(offer, additionalData)
            .then(result => {
                if (result && result.code === store.ErrorCode.PAYMENT_CANCELLED) {
                    console.log("User cancelled the Google Play subscription flow.");
                    // setState({ isPurchasing: false });
                } else if (result && result.isError) {
                    console.error("Subscription order initiation failed: " + result.message);
                    // setState({ isPurchasing: false, error: result.message });
                } else {
                    console.log("Google Play order initiated. Waiting for approval...");
                }
            })
            .catch(err => {
                 console.error("Unexpected error during subscription order:", err);
                 // setState({ isPurchasing: false, error: 'Unexpected error' });
            });

    } else {
        console.error(`Cannot subscribe: Product (${productId}) or Offer (${offerId}) not found or not loaded yet.`);
        alert('Unable to subscribe. Product details might still be loading.');
    }
}
```
*   **Note:** The `additionalData` object is shown with placeholders. For subscription upgrades/downgrades on Google Play, you might need to set `oldPurchaseToken` and `replacementMode`. If your products share the same `group`, the plugin attempts to find the `oldPurchaseToken` automatically.

**Step 2: Handle the "Approved" State -> Verify**

*   **What:** Add or modify the `.approved()` listener in `initializeStore` to call `transaction.verify()`.
*   **Why:** Google Play indicates payment success, but you **must** verify the transaction with your validator (connected to the Google Play Developer API) to get the authoritative subscription status and expiry date.

Add/modify the `.approved()` handler within the `store.when()` chain in `initializeStore`:

```javascript
// Inside initializeStore() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);

        // Verification is REQUIRED for subscriptions on Android.
        if (store.validator) {
            console.log('Verification required for subscription transaction: ' + transaction.transactionId);
            // Optional: Update UI to indicate verification
            // setState({ isVerifying: true });
            transaction.verify(); // Initiate verification
        } else {
             console.error("VALIDATOR REQUIRED: Cannot reliably manage subscriptions without receipt validation.");
             alert("Error: Subscription cannot be processed without validation configuration.");
             // Do NOT finish the transaction here.
        }
    })
    // Continue with .verified() and .finished()
```

**Step 3: Handle the "Verified" State -> Finish (Acknowledge)**

*   **What:** Add or modify the `.verified()` listener. This runs after successful validation.
*   **Why:** The `VerifiedReceipt` contains the true subscription status from Google's servers. Now you update your app state and **acknowledge** the purchase by calling `receipt.finish()` (or `transaction.finish()`). Acknowledgment is mandatory within 3 days for Google Play.

Add/modify the `.verified()` handler within the `store.when()` chain:

```javascript
// Inside initializeStore() -> store.when() chain

    .verified(receipt => {
        console.log(`Receipt verified, contains ${receipt.collection.length} verified purchases.`);
        // Optional: Update UI
        // setState({ isVerifying: false });

        // Update UI based on verified data
        renderUI(); // Ensure UI reflects the latest verified status

        // Finish (acknowledge) the transaction(s) in the receipt with Google Play.
        console.log(`Finishing verified receipt's source transaction(s): ${receipt.sourceReceipt.transactions.map(t=>t.transactionId).join(', ')}`);
        receipt.finish();
    })
    // Continue with .finished()
```

**Step 4: Handle the "Finished" State**

*   **What:** Add or modify the `.finished()` listener. Fires after successful acknowledgment via `finish()`.
*   **Why:** Confirms Google Play has processed the acknowledgment. Useful for final UI updates or logging.

Add/modify the `.finished()` handler within the `store.when()` chain:

```javascript
// Inside initializeStore() -> store.when() chain

    .finished(transaction => {
        console.log(`Transaction ${transaction.transactionId} finished (acknowledged) for ${transaction.products[0]?.id}.`);
        // Subscription state should reflect verified data. Maybe clear any final loading states.
        // setState({ isPurchasing: false, isVerifying: false });
        renderUI(); // Refresh UI one last time if needed
    });

// --- Final Initialization Call ---
// Ensure this is still present at the end of initializeStore()
store.initialize(...).then(...);
```

---

**Build and Test (Android/Google Play Subscription)**

Testing subscriptions on Google Play requires using the testing tracks and specific procedures:

1.  **Create Release Build:** Sign your APK/AAB with your release keystore (`android-release.sh` or similar).
2.  **Upload to Play Console:** Upload the build to **Internal testing** or **Closed testing**. Ensure your validator is configured and connected to the Google Play Developer API (see [Setup Step 9](!UNRESOLVED-LINK:./sections/setup-subscription-android-9-validation-server.md)). Add testers. Roll out.
3.  **Prepare Test Device:** Use a physical device logged in *only* with a tester Google account. Install the app *from the Play Store* via the test link.
4.  **Run & Monitor:** Launch the app, monitor with `adb logcat`.
5.  **Test Subscription:**
    *   Verify UI shows "Not Subscribed" initially, product details load.
    *   Tap "Subscribe".
    *   The Google Play purchase sheet appears. It will mention test purchase behavior (e.g., quick renewals/expiries). Confirm the purchase.
    *   Observe logs: `approved`, `Verification required...`, `Receipt verified...`, `Finishing...`, `finished`.
    *   The UI (`renderUI`) should update based on the `verified` event data, showing "Subscribed" with the correct expiry date from the validator.
    *   **Test Renewals:** Depending on the subscription duration set for testing in Play Console (e.g., 5 minutes), keep the app open or reopen it around the renewal time. You should observe new `approved` -> `verified` -> `finished` cycles as the subscription auto-renews in the test environment.
    *   **Test Management:** Use `store.manageSubscriptions()` to open the Google Play subscription center and test cancellations or plan changes (if applicable). Changes should reflect after subsequent validation (`store.update()` or automatic checks).

---

This covers the Android subscription flow. Key points are the necessity of a **validator connected to the Google Play Developer API** and **acknowledging** purchases via `finish()`.