### Purchase Flow (iOS/App Store Subscription)

With the store initialized, validator configured, and subscription products displayed, we'll now implement the logic for handling the subscription purchase process when the user taps "Subscribe". For subscriptions, verification and finishing are crucial.

**Step 1: Implement the Subscription Purchase Action**

*   **What:** Fill in the `window.subscribe` function (defined as a stub in the generic section) to call `store.order()` with the selected offer.
*   **Why:** This initiates the subscription purchase flow with the App Store.

Replace the placeholder `window.subscribe` function in `www/js/index.js` with this implementation:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.subscribe = function(productId, platform, offerId) {
    console.log(`Subscribe button clicked for ${productId}, offer ${offerId} on ${platform}`);
    const { store, Platform } = CdvPurchase;

    // Ensure we're dealing with the correct platform if explicitly passed
    if (platform !== Platform.APPLE_APPSTORE) {
        console.error("This function is currently specific to AppStore!");
        return;
    }

    const product = store.get(productId, Platform.APPLE_APPSTORE);
    const offer = product?.getOffer(offerId); // Get the specific offer

    if (offer) {
        console.log(`Initiating order for offer: ${offer.id}`);
        // Optional: Update UI to indicate processing
        // setState({ isPurchasing: true });

        // For subscriptions, you might pass an obfuscated applicationUsername
        // store.order(offer, { applicationUsername: 'hashedUserId123' })
        store.order(offer)
            .then(result => {
                // Order initiated or cancelled by user
                if (result && result.code === store.ErrorCode.PAYMENT_CANCELLED) {
                    console.log("User cancelled the subscription flow.");
                    // setState({ isPurchasing: false });
                } else if (result && result.isError) {
                    console.error("Order initiation failed: " + result.message);
                    // setState({ isPurchasing: false, error: result.message });
                } else {
                    console.log("Subscription order initiated. Waiting for approval...");
                    // isPurchasing state might remain true
                }
            })
            .catch(err => {
                 console.error("Unexpected error during subscription order:", err);
                 // setState({ isPurchasing: false, error: 'Unexpected error' });
            });

    } else {
        console.error(`Cannot subscribe: Product (${productId}) or Offer (${offerId}) not found or not loaded yet.`);
        alert('Unable to subscribe. Product details might still be loading or identifiers are incorrect.');
    }
}
```

*   **Note:** We retrieve the specific `offer` using `product.getOffer(offerId)`. For simple cases with only one offer per product, you could just use `product.getOffer()`.

**Step 2: Handle the "Approved" State -> Verify**

*   **What:** Add or modify the `.approved()` listener in `initializeStore` to call `transaction.verify()`.
*   **Why:** When a subscription purchase is approved by Apple, you **must** verify the receipt with your validator. This is the *only* reliable way to get the current subscription status, expiry date, and renewal intent from Apple's servers.

Add/modify the `.approved()` handler within the `store.when()` chain in `initializeStore`:

```javascript
// Inside initializeStore() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);

        // Verification is REQUIRED for subscriptions to get actual status.
        if (store.validator) {
            console.log('Verification required for subscription transaction: ' + transaction.transactionId);
            // Optional: Update UI to indicate verification is in progress
            // setState({ isVerifying: true });
            transaction.verify(); // Initiate verification
        } else {
             console.error("VALIDATOR REQUIRED: Cannot reliably manage subscriptions without receipt validation.");
             alert("Error: Subscription cannot be processed without validation.");
             // Do NOT finish the transaction here without validation for subscriptions.
             // It might get stuck or lead to incorrect state.
        }
    })
    // Add .verified() and .finished() next
```

**Step 3: Handle the "Verified" State -> Finish**

*   **What:** Add or modify the `.verified()` listener. This is triggered after successful validation.
*   **Why:** Upon successful verification, the `VerifiedReceipt` contains the authoritative subscription status from Apple. Now is the time to update your app's state based on this verified data and then **finish** the transaction to acknowledge it with the App Store.

Add/modify the `.verified()` handler within the `store.when()` chain:

```javascript
// Inside initializeStore() -> store.when() chain

    .verified(receipt => {
        console.log(`Receipt verified, contains ${receipt.collection.length} verified purchases.`);
        // Optional: Update UI to clear any "verifying" state
        // setState({ isVerifying: false });

        // Process the verified data - typically involves updating the UI
        // based on the content of receipt.collection and store.verifiedPurchases
        renderUI(); // Re-render the UI with potentially updated subscription status

        // Finish the transaction associated with this receipt.
        // For subscriptions, finishing acknowledges the transaction.
        console.log(`Finishing receipt's source transaction: ${receipt.sourceReceipt.transactions[0]?.transactionId}`);
        receipt.finish(); // Finishes all transactions in the source receipt
    })
    // Add .finished() next
```

*   **Note:** `receipt.finish()` will call `transaction.finish()` on the underlying transaction(s) within the original `Receipt` that was verified.

**Step 4: Handle the "Finished" State**

*   **What:** Add or modify the `.finished()` listener.
*   **Why:** Confirms the transaction was acknowledged by the App Store. This is mostly for logging or cleanup after the entitlement has already been granted based on the verified receipt.

Add/modify the `.finished()` handler within the `store.when()` chain:

```javascript
// Inside initializeStore() -> store.when() chain

    .finished(transaction => {
        console.log(`Transaction ${transaction.transactionId} finished for ${transaction.products[0]?.id}.`);
        // Subscription state should already be reflected based on verified data.
        // UI should already be up-to-date via the .verified() handler triggering renderUI().
    });

// --- Final Initialization Call ---
// Ensure this is still present at the end of initializeStore()
store.initialize(...).then(...);
```

---

**Build and Test (iOS/App Store Subscription)**

Testing subscriptions follows the same general process as non-consumables, but you need to pay attention to renewal cycles and management options.

**1. Prepare & Build:**

*   Save all changes.
*   Run `cordova prepare ios`.
*   Run `open platforms/ios/*.xcodeproj`.

**2. Configure & Run in Xcode:**

*   Set up signing and select your physical test device (Simulators don't work reliably).
*   **Important:** Ensure you have configured a **Receipt Validator URL** in `initializeStore`. Subscription testing *requires* validation.
*   **Sign Out** of the production App Store on your device (`Settings` -> `App Store` -> Sign Out). Do **NOT** sign into the Sandbox account yet.
*   Run the app from Xcode (▶).

**3. Test Subscription Purchase:**

*   Observe the UI and Xcode console logs.
*   Initial status should be "Not Subscribed". Product details should load.
*   Tap the **"Subscribe"** button for one of your subscription products.
*   When prompted by the system sheet, **sign in** with your **Sandbox Tester** account.
*   Confirm the subscription purchase (it will show "[Environment: Sandbox]").
*   Observe the logs:
    *   `Transaction ... approved...`
    *   `Verification required...`
    *   `(After validator responds) Receipt verified...`
    *   `Finishing receipt's source transaction...`
    *   `Transaction ... finished...`
*   Observe the UI: The `renderUI` function should now detect the active subscription from `store.verifiedPurchases` and display the "Subscribed" status along with the expiry date provided by the validator. The "Subscribe" button for the active plan (and others in the same group) should disappear or change.

**4. Test Renewals (Sandbox):**

*   Sandbox subscriptions renew at an accelerated rate (e.g., a 1-month subscription might renew every 5 minutes).
*   Keep the app running (or reopen it after the expected renewal time).
*   You should see new `approved` -> `verified` -> `finished` events logged as the subscription renews automatically. The expiry date displayed in the UI should update accordingly after each verification.

**5. Test Management:**

*   Tap the "Manage Subscription" button (if rendered by your `renderUI` function).
*   This should open the system's subscription management interface for the Sandbox environment, allowing the test user to change plans or cancel.

---

This completes the subscription purchase flow for iOS/App Store. Remember that accurate status relies heavily on the configured receipt validator.