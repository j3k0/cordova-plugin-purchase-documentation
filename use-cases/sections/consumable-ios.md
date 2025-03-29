### Purchase Flow (iOS/App Store Consumable)

This section details how to handle the purchase of a consumable item (like virtual currency or extra lives) on iOS/App Store after the initial setup.

**Step 1: Implement the Purchase Action**

*   **What:** Implement the `purchaseConsumable1` function (called by the "Buy Now!" button created in the generic section) to initiate the order using `store.order()`.
*   **Why:** This triggers the App Store purchase process when the user clicks the button.

Add this function to `www/js/index.js` (or replace the stub if you created one):

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.purchaseConsumable1 = function() {
    const productId = 'consumable1'; // Use the SAME product ID you registered
    console.log(`Purchase button clicked for consumable: ${productId}`);
    const { store, Platform } = CdvPurchase;

    const product = store.get(productId, Platform.APPLE_APPSTORE); // Get AppStore product
    const offer = product?.getOffer(); // Get the default offer

    if (offer) {
        console.log(`Initiating order for consumable offer: ${offer.id}`);
        // Optional: Update UI to show processing/loading state
        // setState({ isPurchasing: true });

        store.order(offer)
            .then(result => {
                if (result && result.code === store.ErrorCode.PAYMENT_CANCELLED) {
                    console.log("User cancelled the purchase.");
                    // setState({ isPurchasing: false });
                } else if (result && result.isError) {
                    console.error("Order initiation failed: " + result.message);
                    // setState({ isPurchasing: false, error: result.message });
                } else {
                    console.log("Order initiated. Waiting for approval...");
                }
            })
            .catch(err => {
                 console.error("Unexpected error during consumable order:", err);
                 // setState({ isPurchasing: false, error: 'Unexpected error' });
            });
    } else {
        console.error(`Cannot purchase: Product (${productId}) or offer not found or not loaded yet.`);
        alert('Unable to purchase. Product details might still be loading.');
    }
}
```

**Step 2: Handle the "Approved" State -> Verify (Recommended)**

*   **What:** Add an `.approved()` listener using `store.when()` in `initializeStore`. When a purchase is approved by Apple, we should ideally verify it.
*   **Why:** Verification confirms the purchase's legitimacy with Apple's servers before granting the consumable item.

Add this within the `store.when()` chain in `initializeStore`:

```javascript
// Inside initializeStore() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);

        // Verification is recommended.
        if (store.validator) {
            console.log('Verification pending for ' + transaction.transactionId);
            // Optional: Update UI
            // setState({ isVerifying: true });
            transaction.verify();
        } else {
             console.warn("Receipt validator not configured. Granting consumable without server verification.");
             // Grant the item and finish directly if no validator.
             grantConsumableAndFinish(transaction);
        }
    })
    // Add .verified() and .finished() next
```

**Step 3: Handle the "Verified" State (Recommended)**

*   **What:** Add a `.verified()` listener. This runs after successful verification.
*   **Why:** This is the secure point to grant the consumable item(s) to the user and then finish the transaction.

Add this within the `store.when()` chain:

```javascript
// Inside initializeStore() -> store.when() chain

    .verified(receipt => {
        console.log(`Receipt verified for transaction ${receipt.transactions[0]?.transactionId}`);
        // Optional: Update UI
        // setState({ isVerifying: false });

        // Find the relevant transaction
        const verifiedTransaction = receipt.transactions
            .find(t => t.products[0]?.id === 'consumable1'); // Use your consumable product ID

        if (verifiedTransaction) {
            // Grant the item and finish the transaction
            grantConsumableAndFinish(verifiedTransaction);
        } else {
            console.error("Verified receipt didn't contain the expected consumable transaction?");
            // Handle this unexpected case - perhaps finish without granting?
            // Or log an error. For safety, you might just finish to clear the queue.
            receipt.finish();
        }
    })
    // Add .finished() next
```

**Step 4: Handle the "Finished" State**

*   **What:** Add a `.finished()` listener. This fires after `transaction.finish()` completes successfully.
*   **Why:** Confirms the transaction is fully processed by the App Store. For consumables on iOS, calling `finish` *is* the consumption step.

Add this within the `store.when()` chain:

```javascript
// Inside initializeStore() -> store.when() chain

    .finished(transaction => {
        console.log(`Transaction ${transaction.transactionId} finished (consumed) for ${transaction.products[0]?.id}.`);
        // Item should already be granted. Maybe update UI to remove any 'processing' state.
        // setState({ isPurchasing: false, isVerifying: false });
        refreshGoldCoinsUI(); // Refresh the coin display
    });

// --- Final Initialization Call ---
// Ensure this is still present at the end of initializeStore()
store.initialize(...).then(...);
```

**Step 5: Implement Consumable Granting and Finishing Logic**

*   **What:** Create the `grantConsumableAndFinish` function. This function updates the user's balance (e.g., adds gold coins in `localStorage`) and then calls `transaction.finish()`.
*   **Why:** This encapsulates the delivery of the virtual item. Calling `transaction.finish()` on iOS for a consumable effectively "consumes" it, removing it from the transaction queue and allowing it to be purchased again.

Add this new function to `www/js/index.js`:

```javascript
// In js/index.js

function grantConsumableAndFinish(transaction) {
    console.log(`Granting consumable for transaction ${transaction.transactionId}...`);

    // Determine the quantity (usually 1 for App Store unless specified differently at order time, though less common for consumables)
    const quantity = 1; // Assuming 1 unit per purchase for this example
    const coinsToAdd = 10 * quantity; // Example: Grant 10 coins per purchase

    // Add the item(s) to the user's inventory/balance
    const currentCoins = parseInt(window.localStorage.getItem('goldCoins') || '0', 10);
    window.localStorage.setItem('goldCoins', (currentCoins + coinsToAdd).toString());

    console.log(`Added ${coinsToAdd} coins. New balance: ${currentCoins + coinsToAdd}`);

    // Refresh the UI to show the new balance
    refreshGoldCoinsUI();

    // Finish (consume) the transaction with the App Store.
    console.log(`Finishing transaction ${transaction.transactionId}...`);
    transaction.finish();
}
```

---

**Build and Test (iOS/App Store Consumable)**

Follow the same build and test procedure as outlined for non-consumables:

1.  **Prepare:** `cordova prepare ios`
2.  **Open:** `open platforms/ios/*.xcodeproj`
3.  **Configure Xcode:** Set signing, select physical test device.
4.  **Prepare Sandbox Tester:** Sign out of App Store on device, have Sandbox Tester credentials ready.
5.  **Run:** Build and run from Xcode (▶).
6.  **Test:**
    *   Verify initial UI shows product details and "Buy Now!" button.
    *   Tap "Buy Now!".
    *   Sign in with Sandbox Tester when prompted.
    *   Confirm purchase.
    *   Observe logs for `approved`, `verified` (if validator set), `Granting consumable...`, `Finishing transaction...`, `finished` messages.
    *   Verify the gold coin count increases in the UI.
    *   The "Buy Now!" button should become available again shortly after the transaction finishes, allowing repurchase.

---

This completes the purchase flow for iOS/App Store consumables. The key is calling `transaction.finish()` after successfully granting the item to the user, which consumes the purchase on this platform.