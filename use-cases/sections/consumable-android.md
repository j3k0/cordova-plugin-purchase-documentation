### Purchase Flow (Android/Google Play Consumable)

This section implements the purchase logic for consumable items (like virtual currency) on Android using Google Play. The key step here is **consuming** the purchase using `transaction.finish()` after it's been granted to the user.

**Step 1: Implement the Purchase Action (`buyConsumable`)**

*   **What:** Replace the placeholder `window.buyConsumable` function (from the generic initialization) to call `offer.order()` for the Google Play platform.
*   **Why:** Initiates the Google Play purchase dialog when the user clicks the "Buy Coins" button.

Replace the placeholder `window.buyConsumable` function in `www/js/index.js`:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.buyConsumable = function() {
    const productId = 'consumable1'; // Use the SAME product ID you registered
    console.log(`Purchase button clicked for consumable: ${productId}`);
    const { store, Platform } = CdvPurchase; // Get Platform enum

    // Ensure we target the correct platform product
    const product = store.get(productId, Platform.GOOGLE_PLAY); // Explicitly get Google Play version
    const offer = product?.getOffer(); // Get the default offer

    if (offer) {
        console.log(`Initiating order for consumable offer: ${offer.id} on platform ${offer.platform}`);
        setStatus('Initiating purchase...');

        // For Android, you might pass obfuscated account/profile IDs for fraud prevention
        // const additionalData = { googlePlay: { accountId: 'hashed_user_id', profileId: 'hashed_profile_id' } };
        // store.order(offer, additionalData)
        offer.order()
            .then(result => {
                // This promise resolves when the purchase flow UI is dismissed (successfully or not).
                // The final outcome is handled by the .approved, .cancelled, or .error listeners.
                if (result && result.isError) {
                    // Handle potential errors during order initiation (rare)
                    setStatus(`Order failed: ${result.message}`);
                } else {
                    // Purchase flow started, waiting for events...
                    // Status message will be updated by listeners.
                }
                refreshUI(); // Refresh UI in case button state needs update
            })
            .catch(err => {
                 // Should generally not happen if store.error is set up
                 console.error("Unexpected error during consumable order:", err);
                 setStatus('Unexpected error during purchase.');
                 refreshUI();
            });

    } else {
        console.error(`Cannot purchase: Product (${productId}) or offer not found or not loaded yet.`);
        setStatus('Error: Unable to purchase. Product details missing.');
    }
}
```

**Step 2: Handle Purchase Events (`.approved`, `.verified`, `.finished`)**

*   **What:** Add the purchase lifecycle event listeners within the `store.when()` chain in your `initializeStoreAndSetupListeners` function (created during generic initialization).
*   **Why:** These listeners handle the progression of the purchase: approval by Google Play, optional verification, and finalization (consumption).

Add these handlers inside the existing `store.when()` call:

```javascript
// Inside initializeStoreAndSetupListeners() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);
        setStatus('Purchase approved. Verifying...');

        // Verification is recommended for security, even for consumables.
        if (store.validator) {
            transaction.verify();
        } else {
             console.warn("Receipt validator not configured. Granting consumable without server verification.");
             // Grant and consume directly if no validator.
             grantAndConsumeItem(transaction);
        }
    })
    .verified(receipt => {
        console.log(`Receipt verified for transaction ${receipt.transactions[0]?.transactionId}`);
        setStatus('Purchase verified. Finishing...');

        // Find the relevant transaction within the verified receipt
        const verifiedTransaction = receipt.transactions
            .find(t => t.products[0]?.id === MY_CONSUMABLE_ID); // Use your consumable product ID

        if (verifiedTransaction) {
            // Grant the item and CONSUME the transaction
            grantAndConsumeItem(verifiedTransaction);
        } else {
            console.error("Verified receipt didn't contain the expected consumable transaction?");
            // Finish anyway to clear the queue if possible
            receipt.finish();
        }
    })
    .finished(transaction => {
        console.log(`Transaction ${transaction.transactionId} finished (consumed) for ${transaction.products[0]?.id}.`);
        setStatus('Purchase complete! Coins granted.');
        // Item should already be granted. Update UI to allow repurchase.
        refreshUI(); // Refresh coin display & product UI
    })
    .cancelled(transaction => {
        console.log('Purchase Cancelled:', transaction.transactionId);
        setStatus('Purchase cancelled.');
        refreshUI();
    });
    // Ensure the .productUpdated listener from the generic setup is still present
```

**Step 3: Implement Granting and Consumption Logic (`grantAndConsumeItem`)**

*   **What:** Replace the placeholder `grantAndConsumeItem` function. It updates the user's balance and calls `transaction.finish()`.
*   **Why:** This function delivers the item. Crucially, for consumables on Google Play, calling `transaction.finish()` **triggers consumption** via the Billing Library's `consumeAsync`, making the item available for purchase again.

Replace the placeholder `grantAndConsumeItem` function in `www/js/index.js`:

```javascript
// In js/index.js

// Replace the placeholder function
function grantAndConsumeItem(transaction) {
    console.log(`Granting consumable for transaction ${transaction.transactionId}...`);

    // Determine quantity - Google Play supports multi-quantity, default to 1
    const quantity = transaction.quantity || 1;
    const coinsToAdd = COINS_GRANTED * quantity; // Use the constant defined earlier

    // Add item(s) to inventory/balance
    const currentCoins = parseInt(window.localStorage.getItem(COIN_BALANCE_KEY) || '0', 10);
    window.localStorage.setItem(COIN_BALANCE_KEY, (currentCoins + coinsToAdd).toString());

    console.log(`Added ${coinsToAdd} coins (Quantity: ${quantity}). New balance: ${currentCoins + coinsToAdd}`);

    // Refresh UI immediately (optional, .finished listener also calls refreshUI)
    // refreshUI();

    // Consume the purchase with Google Play by calling finish()
    console.log(`Consuming (finishing) transaction ${transaction.transactionId}...`);
    transaction.finish();
}
```

---

**Build and Test (Android/Google Play Consumable)**

Follow the testing procedure outlined for non-consumables on Android, keeping consumables in mind:

1.  **Create Release Build:** Use your release keystore.
2.  **Upload to Play Console:** Upload the signed APK/AAB to an internal or closed testing track. Add testers. Roll out.
3.  **Prepare Test Device:** Use a physical device logged in *only* with a tester Google account. Install the app *from the Play Store* using the test link/invitation.
4.  **Run & Monitor:** Launch the app and monitor logs with `adb logcat CordovaPurchase:V CordovaLog:V chromium:D *:S`.
5.  **Test Purchase:**
    *   Verify initial UI (coin count, product details, buy button).
    *   Tap "Buy Coins".
    *   Confirm purchase in the Google Play dialog ("Test card, always approves").
    *   Observe logs: `approved`, `verified` (if validator set), `Granting consumable...`, `Consuming (finishing) transaction...`, `finished`.
    *   Verify the coin count increases correctly.
    *   The "Buy Coins" button should remain available, allowing repurchase.

---

This completes the consumable purchase flow for Android/Google Play. The key step is using `transaction.finish()`, which implicitly consumes the product on this platform for this product type, making it available for purchase again.
