### Purchase Flow (iOS/App Store Consumable)

This section details how to handle the purchase of a consumable item (like virtual currency or extra lives) on iOS/App Store, assuming you have completed the [generic consumable initialization](consumable-generic-initialization.md). The process is very similar to Android, with `transaction.finish()` also serving to consume the item.

**Step 1: Implement the Purchase Action (`buyConsumable`)**

*   **What:** Replace the placeholder `window.buyConsumable` function to call `offer.order()` for the App Store platform.
*   **Why:** This triggers the App Store purchase process when the user clicks the "Buy Coins" button.

Replace the placeholder `window.buyConsumable` function in `www/js/index.js`:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.buyConsumable = function() {
    const productId = 'consumable1'; // Use the SAME product ID you registered
    console.log(`Purchase button clicked for consumable: ${productId}`);
    const { store, Platform } = CdvPurchase;

    const product = store.get(productId, Platform.APPLE_APPSTORE); // Get AppStore product
    const offer = product?.getOffer(); // Get the default offer

    if (offer) {
        console.log(`Initiating order for consumable offer: ${offer.id}`);
        setStatus('Initiating purchase...');

        offer.order()
            .then(result => {
                // Promise resolves when the App Store sheet is dismissed.
                // Outcome handled by listeners.
                if (result && result.isError) {
                    setStatus(`Order failed: ${result.message}`);
                } else {
                    // Purchase flow started... status updated by listeners.
                }
                refreshUI();
            })
            .catch(err => {
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
*   **Why:** These listeners handle the progression of the purchase: approval by App Store, optional verification, and finalization (consumption).

Add these handlers inside the existing `store.when()` call:

```javascript
// Inside initializeStoreAndSetupListeners() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);
        setStatus('Purchase approved. Verifying...');

        // Verification is recommended.
        if (store.validator) {
            transaction.verify();
        } else {
             console.warn("Receipt validator not configured. Granting consumable without server verification.");
             // Grant the item and finish directly if no validator.
             grantConsumableAndFinish(transaction);
        }
    })
    .verified(receipt => {
        console.log(`Receipt verified for transaction ${receipt.transactions[0]?.transactionId}`);
        setStatus('Purchase verified. Finishing...');

        // Find the relevant transaction
        const verifiedTransaction = receipt.transactions
            .find(t => t.products[0]?.id === MY_CONSUMABLE_ID); // Use your consumable product ID

        if (verifiedTransaction) {
            // Grant the item and finish the transaction
            grantConsumableAndFinish(verifiedTransaction);
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
        refreshUI(); // Refresh the coin display & product UI
    })
    .cancelled(transaction => {
        console.log('Purchase Cancelled:', transaction.transactionId);
        setStatus('Purchase cancelled.');
        refreshUI();
    });
    // Ensure the .productUpdated listener from the generic setup is still present
```

**Step 3: Implement Granting and Finishing Logic (`grantConsumableAndFinish`)**

*   **What:** Replace the placeholder `grantConsumableAndFinish` function. This function updates the user's balance (e.g., adds gold coins in `localStorage`) and then calls `transaction.finish()`.
*   **Why:** This encapsulates the delivery of the virtual item. Calling `transaction.finish()` on iOS for a consumable effectively **consumes** it, removing it from the transaction queue and allowing it to be purchased again.

Replace the placeholder `grantConsumableAndFinish` function in `www/js/index.js`:

```javascript
// In js/index.js

// Replace the placeholder function
function grantConsumableAndFinish(transaction) {
    console.log(`Granting consumable for transaction ${transaction.transactionId}...`);

    // Determine the quantity (always 1 for App Store consumables)
    const quantity = 1;
    const coinsToAdd = COINS_GRANTED * quantity; // Use constant defined earlier

    // Add the item(s) to the user's inventory/balance
    const currentCoins = parseInt(window.localStorage.getItem(COIN_BALANCE_KEY) || '0', 10);
    window.localStorage.setItem(COIN_BALANCE_KEY, (currentCoins + coinsToAdd).toString());

    console.log(`Added ${coinsToAdd} coins. New balance: ${currentCoins + coinsToAdd}`);

    // Refresh the UI immediately (optional, .finished listener also calls refreshUI)
    // refreshUI();

    // Finish (consume) the transaction with the App Store.
    console.log(`Finishing transaction ${transaction.transactionId}...`);
    transaction.finish();
}
```

---

**Build and Test (iOS/App Store Consumable)**

Follow the testing procedure outlined for non-consumables on iOS:

1.  **Prepare:** `cordova prepare ios`
2.  **Open:** `open platforms/ios/*.xcodeproj` (or `.xcworkspace`)
3.  **Configure Xcode:** Set signing, select physical test device.
4.  **Prepare Sandbox Tester:** Sign out of App Store on device, have Sandbox Tester credentials ready.
5.  **Run:** Build and run from Xcode (▶).
6.  **Test:**
    *   Verify initial UI shows product details and "Buy Coins" button.
    *   Tap "Buy Coins".
    *   Sign in with Sandbox Tester when prompted.
    *   Confirm purchase.
    *   Observe logs for `approved`, `verified` (if validator set), `Granting consumable...`, `Finishing transaction...`, `finished` messages.
    *   Verify the gold coin count increases in the UI.
    *   The "Buy Coins" button should remain available, allowing repurchase.

---

This completes the purchase flow for iOS/App Store consumables. The key is calling `transaction.finish()` after successfully granting the item to the user, which consumes the purchase on this platform.
