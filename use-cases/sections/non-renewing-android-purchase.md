### Purchase Flow (Android Non-Renewing)

Handling the purchase flow for non-renewing subscriptions on Google Play requires acknowledging the purchase to Google, similar to non-consumables. Your application logic is responsible for managing the entitlement period.

1.  **Initiate Order:**
    When the user clicks the "Subscribe" or "Extend" button, call `store.order()` on the relevant offer.

    ```javascript
    function purchaseNonRenewingSubscription() {
        const offer = store.get('my_non_renewing_sub_id', Platform.GOOGLE_PLAY)?.getOffer();
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
    Set up listeners for the `approved` and `verified` states. Verification adds a layer of security.

    ```javascript
    // In your store initialization (e.g., inside onDeviceReady or initStore)
    store.when()
        .approved(transaction => {
            // Optional: Verify the transaction
            // If you have a validator, verification provides extra security
            // and potentially fetches accurate purchase/expiry times if needed.
            if (store.validator) {
                transaction.verify();
            } else {
                // No validator, proceed directly to finish/acknowledge
                acknowledgePurchase(transaction);
            }
        })
        .verified(receipt => {
            // Acknowledgment is done after verification succeeds
            const transaction = receipt.transactions[0]; // Assuming one transaction per receipt here
            if (transaction) {
                acknowledgePurchase(transaction);
            }
        });
    ```

3.  **Acknowledge (Finish) the Purchase:**
    This is the crucial step for non-renewing subscriptions (and non-consumables) on Google Play. Call `transaction.finish()` to acknowledge the purchase. **Do not consume it.**

    ```javascript
    function acknowledgePurchase(transaction) {
        // Grant entitlement based on the product purchased
        // e.g., Calculate expiry date: now + product duration
        const productDurationMonths = 1; // Example: get this from product definition
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + productDurationMonths);

        // Store the expiry date persistently
        window.localStorage.setItem('nonRenewingExpiry', expiryDate.toISOString());
        console.log(`Access granted until: ${expiryDate.toISOString()}`);

        // Acknowledge the purchase with Google Play
        transaction.finish();

        // Refresh UI to show the new expiry date
        refreshUI(); // Make sure your refreshUI function reads the expiry date
    }
    ```

4.  **Manage Entitlement:**
    Your application must check the stored expiry date whenever the user tries to access the protected content or service.

    ```javascript
    function hasActiveNonRenewingAccess() {
        const expiryString = window.localStorage.getItem('nonRenewingExpiry');
        if (!expiryString) return false;
        const expiryDate = new Date(expiryString);
        return expiryDate > new Date();
    }

    // Example usage:
    if (hasActiveNonRenewingAccess()) {
        // Show premium content
    } else {
        // Show purchase options
    }
    ```

**Key Points:**

*   **Acknowledge, Don't Consume:** Use `transaction.finish()` to acknowledge. Consuming would remove the entitlement.
*   **Track Expiry:** Your app must calculate and track the expiry date based on the purchase time and the duration defined for the product ID.
*   **Persistence:** Store the expiry date reliably (e.g., `localStorage`, secure storage, synced backend).
