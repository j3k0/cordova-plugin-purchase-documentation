### Purchase Flow (Android/Google Play Non-Renewing Subscription)

This section implements the purchase logic for **non-renewing subscriptions** on **Android using Google Play**. Your application manages the entitlement period, and you **must acknowledge** the purchase with Google Play using `transaction.finish()`.

**Step 1: Implement the Purchase Action (`purchaseNonRenewing`)**

*   **What:** Replace the placeholder `window.purchaseNonRenewing` function to call `offer.order()` for the Google Play platform.
*   **Why:** Starts the Google Play purchase dialog for the non-renewing product.

{% code title="www/js/index.js (purchaseNonRenewing)" %}
```javascript
// Replace the placeholder purchaseNonRenewing function
window.purchaseNonRenewing = function() {
    const productId = 'non_renewing_1_month'; // Use the SAME product ID you registered
    console.log(`Purchase button clicked for non-renewing: ${productId}`);
    const { store, Platform } = CdvPurchase;

    const product = store.get(productId, Platform.GOOGLE_PLAY);
    const offer = product?.getOffer();

    if (offer) {
        console.log(`Initiating order for non-renewing offer: ${offer.id}`);
        setStatus('Initiating purchase...');

        // const additionalData = { googlePlay: { accountId: 'hashed_user_id' } };
        // offer.order(additionalData)
        offer.order()
            .then(result => {
                if (result && result.isError) {
                    setStatus(`Order failed: ${result.message}`);
                } else {
                    // Purchase flow started... status updated by listeners.
                }
                refreshUI();
            })
            .catch(err => {
                 console.error("Unexpected error during non-renewing order:", err);
                 setStatus('Unexpected error during purchase.');
                 refreshUI();
            });
    } else {
        console.error(`Cannot purchase: Product (${productId}) or offer not found.`);
        setStatus('Error: Unable to purchase. Product details missing.');
    }
}
```
{% endcode %}

**Step 2: Handle Purchase Events (`.approved`, `.verified`, `.finished`)**

*   **What:** Add the purchase lifecycle event listeners within the `store.when()` chain in `initializeStoreAndSetupListeners`.
*   **Why:** These listeners handle the purchase approval, optional verification (useful for getting an accurate `purchaseDate`), and mandatory acknowledgment.

Add these handlers inside the existing `store.when()` call:

{% code title="www/js/index.js (listeners within store.when)" %}
```javascript
  .approved(transaction => {
    console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);
    setStatus('Purchase approved. Verifying...');
    // Verify if a validator is configured (optional but recommended for purchaseDate)
    if (store.validator) {
      transaction.verify();
    } else {
      console.warn("Receipt validator not configured. Using local date for expiry calculation.");
      grantAccessAndAcknowledge(transaction); // Proceed without validation
    }
  })
  .verified(receipt => {
    console.log(`Receipt verified for transaction ${receipt.transactions[0]?.transactionId}`);
    setStatus('Purchase verified. Finishing...');
    const verifiedTransaction = receipt.transactions.find(t => t.products[0]?.id === MY_NON_RENEWING_ID);
    if (verifiedTransaction) {
      grantAccessAndAcknowledge(verifiedTransaction); // Use verified transaction data
    } else {
      console.error("Verified receipt didn't contain the expected transaction?");
      receipt.finish(); // Finish anyway
    }
  })
  .finished(transaction => {
    console.log(`Transaction ${transaction.transactionId} finished (acknowledged) for ${transaction.products[0]?.id}.`);
    setStatus('Purchase complete! Access updated.');
    refreshUI(); // Refresh expiry display
  })
  .cancelled(transaction => {
    console.log('Purchase Cancelled:', transaction.transactionId);
    setStatus('Purchase cancelled.');
    refreshUI();
  });
```
{% endcode %}

**Step 3: Implement Access Granting, Expiry Calculation, and Acknowledgment (`grantAccessAndAcknowledge`)**

*   **What:** Replace the placeholder `grantAccessAndFinish` function. This function calculates the expiry date based on the `purchaseDate` and product duration, stores it persistently (**use SecureStorage in production!**), updates the UI, and calls `transaction.finish()` to **acknowledge** the purchase.
*   **Why:** Your app manages the entitlement period. `finish()` is **mandatory** for Google Play within 3 days to prevent automatic refunds for non-renewing items. **Do not consume** these items.

Replace the placeholder `grantAccessAndFinish` function in `www/js/index.js`:

{% code title="www/js/index.js (grantAccessAndAcknowledge)" %}
```javascript
// Replace the placeholder grantAccessAndFinish function
function grantAccessAndAcknowledge(transaction) {
    const productId = transaction.products[0]?.id;
    if (productId !== MY_NON_RENEWING_ID) return; // Ensure correct product

    console.log(`Granting access for non-renewing subscription ${productId}, transaction ${transaction.transactionId}...`);

    // 1. Determine duration based on productId (e.g., from product metadata or a config map)
    // For this example, assume MY_NON_RENEWING_ID ('non_renewing_1_month') grants 1 month.
    let durationMonths = 0;
    if (productId === 'non_renewing_1_month') { // <<< YOUR Non-Renewing Product ID
        durationMonths = 1;
    } // Add else if for other durations (e.g., 'non_renewing_1_year')

    if (durationMonths === 0) {
        console.error(`Unknown duration for product ${productId}. Cannot grant access.`);
        if (!transaction.isAcknowledged) transaction.finish(); // Acknowledge anyway
        return;
    }

    // 2. Get purchase date (verified date is preferred, fallback to transaction date or now)
    const purchaseDate = transaction.purchaseDate || new Date();

    // 3. Calculate new expiry date (handle extending existing access)
    const currentExpiry = getAccessExpiryDate(); // Function from generic init
    const startDateMs = Math.max(Date.now(), currentExpiry ? currentExpiry.getTime() : 0);
    const newExpiryDate = new Date(startDateMs);
    newExpiryDate.setMonth(newExpiryDate.getMonth() + durationMonths);

    console.log(`Purchase Date: ${purchaseDate.toISOString()}`);
    console.log(`Current Expiry: ${currentExpiry?.toISOString() ?? 'None'}`);
    console.log(`Calculated New Expiry: ${newExpiryDate.toISOString()} (Duration: ${durationMonths} months)`);

    // 4. Store the new expiry date persistently (Use SecureStorage in production!)
    try {
        window.localStorage.setItem(ACCESS_EXPIRY_KEY, newExpiryDate.toISOString());
        console.log('Expiry date saved to localStorage.');
    } catch (e) {
        console.error('Error saving expiry to localStorage:', e);
    }

    // 5. Refresh UI immediately (optional, .finished listener also calls refreshUI)
    // refreshUI();
    // alert(`Access granted/extended until ${newExpiryDate.toLocaleDateString()}!`);

    // 6. Acknowledge the purchase with Google Play by calling finish()
    // This prevents refunds for non-renewing/non-consumable types.
    if (!transaction.isAcknowledged) {
        console.log(`Acknowledging (finishing) transaction ${transaction.transactionId}...`);
        transaction.finish();
    } else {
        console.log(`Transaction ${transaction.transactionId} already acknowledged.`);
    }
}
```
{% endcode %}

---

**Build and Test (Android/Google Play Non-Renewing)**

Follow the standard Android testing procedure:

1.  **Create Release Build:** Sign with your release keystore.
2.  **Upload to Play Console:** Upload to Internal/Closed testing. Add testers. Roll out.
3.  **Prepare Test Device:** Physical device, *only* tester Google account active. Install from Play Store via test link.
4.  **Run & Monitor:** Launch app, use `adb logcat`.
5.  **Test Purchase:**
    *   Verify initial UI (access status, product details, button).
    *   Tap "Buy Access" / "Extend Access".
    *   Confirm in Google Play dialog ("Test card...").
    *   Observe logs: `approved`, `verified` (if validator set), `Granting access...`, `Calculated New Expiry...`, `Acknowledging (finishing)...`, `finished`.
    *   Verify UI updates with the correct expiry date.
    *   **Restart app:** Ensure expiry persists in your storage.
    *   **Test Extension:** Purchase again and verify the expiry date extends correctly based on your logic in `grantAccessAndAcknowledge`.

---

This handles the non-renewing subscription flow on Android, ensuring the purchase is acknowledged via `transaction.finish()` while your application manages the entitlement period based on the calculated expiry date.
