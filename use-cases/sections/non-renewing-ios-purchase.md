### Purchase Flow (iOS/macOS Non-Renewing)

Handling the purchase flow for non-renewing subscriptions on Apple platforms involves purchasing the product like any other, acknowledging it, and then managing the entitlement period within your application logic. Apple does not automatically track the expiry or renewal for this type of subscription.

1.  **Initiate Order:**
    When the user clicks the "Subscribe" or "Extend" button, call `store.order()` on the relevant offer.

    ```javascript
    function purchaseNonRenewingSubscription() {
        const offer = store.get('my_non_renewing_sub_id', Platform.APPLE_APPSTORE)?.getOffer();
        if (offer) {
            store.order(offer)
                .then(result => {
                    if (result && result.isError) {
                        // Handle error (e.g., payment cancelled)
                        console.error("Order failed: " + result.message);
                    } else {
                        // Optional: Update UI to show processing state if needed
                        console.log("Order successful, waiting for approval/verification.");
                    }
                });
        } else {
            console.error("Offer not found for non-renewing subscription.");
        }
    }
    ```

2.  **Handle Approval & Verification (Optional but Recommended):**
    Set up listeners for the `approved` and `verified` states. Verification is useful for obtaining the `purchaseDate` accurately from Apple's servers, which you'll need to calculate the expiry.

    ```javascript
    // In your store initialization (e.g., inside onDeviceReady or initStore)
    store.when()
        .approved(transaction => {
            // Optional: Verify the transaction to get accurate purchaseDate
            // and confirm legitimacy.
            if (store.validator) {
                transaction.verify();
            } else {
                // No validator, proceed directly to finish/acknowledge
                // Note: transaction.purchaseDate might be less reliable without validation.
                acknowledgePurchase(transaction);
            }
        })
        .verified(receipt => {
            // Acknowledgment is done after verification succeeds
            const transaction = receipt.transactions.find(t => t.products[0]?.id === 'my_non_renewing_sub_id'); // Find the relevant transaction
            if (transaction) {
                acknowledgePurchase(transaction);
            }
        });
    ```

3.  **Acknowledge (Finish) the Purchase & Calculate Expiry:**
    Call `transaction.finish()` to acknowledge the purchase with Apple. Crucially, you must then calculate and store the expiry date based on the product's defined duration and the transaction's `purchaseDate`.

    ```javascript
    function acknowledgePurchase(transaction) {
        // Grant entitlement based on the product purchased
        // 1. Get the accurate purchase date (ideally from verified receipt if possible)
        const purchaseDate = transaction.purchaseDate || new Date(); // Fallback to now if date missing

        // 2. Determine the duration from your product definition
        const productDurationMonths = 6; // Example: Get this (e.g., 6 months) based on transaction.products[0].id

        // 3. Calculate expiry date
        const expiryDate = new Date(purchaseDate);
        expiryDate.setMonth(expiryDate.getMonth() + productDurationMonths);

        // 4. Store the expiry date persistently and associate with the user/device
        //    This might involve localStorage, secure storage, or your backend.
        //    If syncing across devices, ensure this is tied to the user's account.
        window.localStorage.setItem('nonRenewingExpiry_' + transaction.products[0].id, expiryDate.toISOString());
        console.log(`Access granted for ${transaction.products[0].id} until: ${expiryDate.toISOString()}`);

        // 5. Acknowledge the purchase with Apple AppStore
        transaction.finish();

        // 6. Refresh UI to show the new expiry date
        refreshUI(); // Ensure your refreshUI reads the stored expiry date
    }
    ```

4.  **Manage Entitlement:**
    Your application must check the stored expiry date whenever the user tries to access the protected content or service. Sync this state if users can log into accounts on multiple devices.

    ```javascript
    function hasActiveNonRenewingAccess(productId) {
        const expiryString = window.localStorage.getItem('nonRenewingExpiry_' + productId);
        if (!expiryString) return false;
        const expiryDate = new Date(expiryString);
        return expiryDate > new Date();
    }

    // Example usage:
    if (hasActiveNonRenewingAccess('my_non_renewing_sub_id')) {
        // Show premium content
    } else {
        // Show purchase options
    }
    ```

**Key Points:**

*   **Acknowledge:** Always call `transaction.finish()`.
*   **Track Expiry:** Your app *must* calculate, store, and check the expiry date. Apple does not manage this for non-renewing types.
*   **Purchase Date:** Use the `transaction.purchaseDate`. Verification (`transaction.verify()`) provides the most reliable date from Apple's servers.
*   **Persistence & Syncing:** Store the expiry date securely and sync across devices if necessary for your use case.
