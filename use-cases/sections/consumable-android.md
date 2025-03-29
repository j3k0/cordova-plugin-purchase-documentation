### Purchase Flow (Android/Google Play Consumable)

This section implements the purchase logic for consumable items (like virtual currency) on Android using Google Play. The key step here is **consuming** the purchase after it's been granted to the user.

**Step 1: Implement the Purchase Action**

*   **What:** Fill in the `window.purchaseConsumable1` function stub to call `store.order()` for the Google Play platform.
*   **Why:** Initiates the Google Play purchase dialog when the user clicks the "Buy Now!" button.

Replace the placeholder `window.purchaseConsumable1` function in `www/js/index.js`:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.purchaseConsumable1 = function() {
    const productId = 'consumable1'; // Use the SAME product ID you registered
    console.log(`Purchase button clicked for consumable: ${productId}`);
    const { store, Platform } = CdvPurchase; // Get Platform enum

    // Ensure we target the correct platform product
    const product = store.get(productId, Platform.GOOGLE_PLAY); // Explicitly get Google Play version
    const offer = product?.getOffer(); // Get the default offer

    if (offer) {
        console.log(`Initiating order for consumable offer: ${offer.id} on platform ${offer.platform}`);
        // Optional: Update UI to show processing/loading state
        // setState({ isPurchasing: true });

        // For Android, you might pass obfuscated account/profile IDs
        // const additionalData = { googlePlay: { accountId: 'hashed_user_id', profileId: 'hashed_profile_id' } };
        // store.order(offer, additionalData)
        store.order(offer)
            .then(result => {
                if (result && result.code === store.ErrorCode.PAYMENT_CANCELLED) {
                    console.log("User cancelled the purchase via Google Play.");
                    // setState({ isPurchasing: false });
                } else if (result && result.isError) {
                    console.error("Order initiation failed: " + result.message);
                    // setState({ isPurchasing: false, error: result.message });
                } else {
                    console.log("Order initiated with Google Play. Waiting for approval...");
                    // isPurchasing state might remain true
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

*   **What:** Add an `.approved()` listener. This fires when Google Play confirms the payment was successful but before it's acknowledged or consumed.
*   **Why:** It's the signal to verify the purchase with your server (if applicable) before proceeding.

Add this within the `store.when()` chain in `initializeStore`:

```javascript
// Inside initializeStore() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);

        // Verification is recommended for security.
        if (store.validator) {
            console.log('Verification pending for ' + transaction.transactionId);
            // Optional: Update UI
            // setState({ isVerifying: true });
            transaction.verify();
        } else {
             console.warn("Receipt validator not configured. Granting consumable without server verification.");
             // Grant and consume directly if no validator.
             grantAndConsumeItem(transaction);
        }
    })
    // Add .verified() and .finished() next
```

**Step 3: Handle the "Verified" State (Recommended)**

*   **What:** Add a `.verified()` listener. Runs after successful server validation via `transaction.verify()`.
*   **Why:** Confirms the purchase is legitimate. Now you should grant the item and **consume** it.

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
            // Grant the item and CONSUME the transaction
            grantAndConsumeItem(verifiedTransaction);
        } else {
            console.error("Verified receipt didn't contain the expected consumable transaction?");
            // If the transaction isn't found, finishing the receipt might still
            // be necessary if other transactions were in it, but we won't grant the item.
            receipt.finish();
        }
    })
    // Add .finished() next
```

**Step 4: Handle the "Finished" State**

*   **What:** Add a `.finished()` listener. Fires after `transaction.finish()` (which triggers consumption for consumables on Android) completes successfully.
*   **Why:** Confirms Google Play has processed the consumption. The item can now be purchased again.

Add this within the `store.when()` chain:

```javascript
// Inside initializeStore() -> store.when() chain

    .finished(transaction => {
        console.log(`Transaction ${transaction.transactionId} finished (consumed) for ${transaction.products[0]?.id}.`);
        // Item should already be granted. Update UI to allow repurchase.
        // setState({ isPurchasing: false, isVerifying: false });
        refreshGoldCoinsUI(); // Refresh coin display
        refreshProductUI(store.get('consumable1')); // Refresh product UI to potentially re-enable button
    });

// --- Final Initialization Call ---
// Ensure this is still present at the end of initializeStore()
store.initialize(...).then(...);
```

**Step 5: Implement Consumable Granting and Consumption Logic**

*   **What:** Create the `grantAndConsumeItem` function. It updates the user's balance and calls `transaction.finish()`.
*   **Why:** This function delivers the item. Crucially, for consumables on Google Play, `transaction.finish()` **triggers consumption**, making the item available for purchase again. This differs from non-consumables where `finish` only acknowledges.

Add this new function to `www/js/index.js`:

```javascript
// In js/index.js

function grantAndConsumeItem(transaction) {
    console.log(`Granting consumable for transaction ${transaction.transactionId}...`);

    // Determine quantity - Google Play supports multi-quantity, default to 1
    const quantity = transaction.quantity || 1;
    const coinsToAdd = 10 * quantity; // Example: 10 coins per unit purchased

    // Add item(s) to inventory/balance
    const currentCoins = parseInt(window.localStorage.getItem('goldCoins') || '0', 10);
    window.localStorage.setItem('goldCoins', (currentCoins + coinsToAdd).toString());

    console.log(`Added ${coinsToAdd} coins (Quantity: ${quantity}). New balance: ${currentCoins + coinsToAdd}`);

    // Refresh UI
    refreshGoldCoinsUI();

    // Consume the purchase with Google Play by calling finish()
    console.log(`Consuming (finishing) transaction ${transaction.transactionId}...`);
    transaction.finish();
}
```

---

**Build and Test (Android/Google Play Consumable)**

Follow the same build, upload, and test procedure as outlined for non-consumables on Android:

1.  **Create Release Build:** Use your release keystore (`android-release.sh` or equivalent).
2.  **Upload to Play Console:** Upload the signed APK/AAB to an internal or closed testing track. Add testers. Roll out.
3.  **Prepare Test Device:** Use a physical device logged in *only* with a tester Google account. Install the app *from the Play Store* using the test link/invitation.
4.  **Run & Monitor:** Launch the app and monitor logs with `adb logcat`.
5.  **Test Purchase:**
    *   Verify initial UI (coin count, product details, buy button).
    *   Tap "Buy Now!".
    *   Confirm purchase in the Google Play dialog ("Test card, always approves").
    *   Observe logs: `approved`, `verified` (if validator set), `Granting consumable...`, `Consuming (finishing) transaction...`, `finished`.
    *   Verify the coin count increases correctly based on quantity (should be 1 for this basic example, unless you implemented multi-quantity orders).
    *   The "Buy Now!" button should become available again after the `finished` event, allowing repurchase.

---

This completes the consumable purchase flow for Android/Google Play. The key step is using `transaction.finish()` which implicitly consumes the product on this platform for this product type.