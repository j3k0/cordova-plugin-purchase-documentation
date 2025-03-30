### Purchase Flow (Android/Google Play Non-Renewing Subscription)

Implementing non-renewing subscriptions on Google Play requires treating them like one-time purchases that grant access for a period *you* define and track. You must **acknowledge** the purchase with Google Play, and your app manages the expiry.

**Step 1: Implement the Purchase Action**

*   **What:** Implement the function called by your "Subscribe" or "Extend Access" button (e.g., `window.purchaseNonRenewing`) to call `store.order()`.
*   **Why:** Starts the Google Play purchase dialog for the non-renewing product.

Create this function in `www/js/index.js`:

```javascript
// In js/index.js

// Make globally accessible for button onclick
window.purchaseNonRenewing = function() {
    const productId = 'non_renewing_sub_1_month'; // <<< YOUR Non-Renewing Product ID
    console.log(`Purchase button clicked for non-renewing: ${productId}`);
    const { store, Platform } = CdvPurchase;

    const product = store.get(productId, Platform.GOOGLE_PLAY);
    const offer = product?.getOffer();

    if (offer) {
        console.log(`Initiating order for non-renewing offer: ${offer.id}`);
        // Optional: Update UI to show processing
        // setState({ isPurchasing: true });

        // const additionalData = { googlePlay: { accountId: 'hashed_user_id' } };
        // store.order(offer, additionalData)
        store.order(offer)
            .then(result => {
                if (result && result.code === store.ErrorCode.PAYMENT_CANCELLED) {
                    console.log("User cancelled the Google Play purchase.");
                    // setState({ isPurchasing: false });
                } else if (result && result.isError) {
                    console.error("Order initiation failed: " + result.message);
                    // setState({ isPurchasing: false, error: result.message });
                } else {
                    console.log("Order initiated with Google Play. Waiting for approval...");
                }
            })
            .catch(err => {
                 console.error("Unexpected error during non-renewing order:", err);
                 // setState({ isPurchasing: false, error: 'Unexpected error' });
            });
    } else {
        console.error(`Cannot purchase: Product (${productId}) or offer not found.`);
        alert('Unable to purchase. Product details might still be loading.');
    }
}
```

**Step 2: Handle the "Approved" State -> Verify (Optional)**

*   **What:** Add an `.approved()` listener. Verification isn't strictly required by Google for acknowledgment but is useful for confirming the purchase and potentially getting a server-verified `purchaseTime`.
*   **Why:** If you need high accuracy for the start time or want server confirmation, verify first. Otherwise, you can proceed to acknowledge directly.

Add this within the `store.when()` chain in `initializeStore`:

```javascript
// Inside initializeStore() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);

        // Verify if a validator is configured (optional but good practice)
        if (store.validator) {
            console.log('Verification pending for ' + transaction.transactionId);
            // setState({ isVerifying: true });
            transaction.verify();
        } else {
             console.warn("Receipt validator not configured. Using local date for expiry calculation.");
             // Proceed to grant access and acknowledge without validation
             grantAccessAndAcknowledge(transaction);
        }
    })
    // Add .verified() and .finished() next
```

**Step 3: Handle the "Verified" State (If using Validator)**

*   **What:** Add a `.verified()` listener. Runs after successful validation.
*   **Why:** Use the verified `purchaseTime` for accurate expiry calculation before granting access and acknowledging.

Add this within the `store.when()` chain:

```javascript
// Inside initializeStore() -> store.when() chain

    .verified(receipt => {
        console.log(`Receipt verified for transaction ${receipt.transactions[0]?.transactionId}`);
        // setState({ isVerifying: false });

        const verifiedTransaction = receipt.transactions
            .find(t => t.products[0]?.id === 'non_renewing_sub_1_month'); // <<< YOUR Non-Renewing Product ID

        if (verifiedTransaction) {
            grantAccessAndAcknowledge(verifiedTransaction);
        } else {
            console.error("Verified receipt didn't contain the expected non-renewing transaction?");
            receipt.finish(); // Finish anyway if possible
        }
    })
    // Add .finished() next
```

**Step 4: Handle the "Finished" State**

*   **What:** Add a `.finished()` listener. Fires after `transaction.finish()` successfully acknowledges the purchase with Google Play.
*   **Why:** Confirms the acknowledgment is complete.

Add this within the `store.when()` chain:

```javascript
// Inside initializeStore() -> store.when() chain

    .finished(transaction => {
        console.log(`Transaction ${transaction.transactionId} finished (acknowledged) for ${transaction.products[0]?.id}.`);
        // Access should be granted. Update UI if needed.
        // setState({ isPurchasing: false, isVerifying: false });
        refreshAccessUI(); // Refresh expiry display
    });

// --- Final Initialization Call ---
store.initialize(...).then(...);
```

**Step 5: Implement Access Granting, Expiry Calculation, and Acknowledgment**

*   **What:** Create the `grantAccessAndAcknowledge` function. This calculates expiry based on `purchaseDate` and product duration, stores it, updates UI, and calls `transaction.finish()` to **acknowledge** the purchase.
*   **Why:** Your app manages the entitlement period. `finish()` is **mandatory** for Google Play to prevent automatic refunds for non-renewing (and non-consumable) items. **Do not consume** these items.

Add this new function to `www/js/index.js`:

```javascript
// In js/index.js

// Key for storing expiry date
const ACCESS_EXPIRY_KEY = 'myServiceAccessExpiry'; // Use the same key as the iOS version if applicable

function grantAccessAndAcknowledge(transaction) {
    const productId = transaction.products[0]?.id;
    console.log(`Granting access for non-renewing subscription ${productId}, transaction ${transaction.transactionId}...`);

    // 1. Determine duration from productId
    let durationMonths = 0;
    if (productId === 'non_renewing_sub_1_month') { // <<< YOUR Non-Renewing Product ID
        durationMonths = 1;
    } // Add other durations...

    if (durationMonths === 0) {
        console.error(`Unknown duration for product ${productId}. Cannot grant access.`);
        transaction.finish(); // Acknowledge anyway
        return;
    }

    // 2. Get purchase date (verified is preferred)
    const purchaseDate = transaction.purchaseDate || new Date();

    // 3. Calculate new expiry date (handle extending existing access)
    const currentExpiryStr = window.localStorage.getItem(ACCESS_EXPIRY_KEY);
    let currentExpiry = currentExpiryStr ? new Date(currentExpiryStr) : new Date(0);
    const startDate = Math.max(Date.now(), currentExpiry.getTime());
    const newExpiryDate = new Date(startDate);
    newExpiryDate.setMonth(newExpiryDate.getMonth() + durationMonths);

    console.log(`Purchase Date: ${purchaseDate.toISOString()}`);
    console.log(`Current Expiry: ${currentExpiry.toISOString()}`);
    console.log(`Calculated New Expiry: ${newExpiryDate.toISOString()} (Duration: ${durationMonths} months)`);

    // 4. Store the new expiry date persistently
    window.localStorage.setItem(ACCESS_EXPIRY_KEY, newExpiryDate.toISOString());

    // 5. Refresh UI
    refreshAccessUI(); // Implement this if not already done
    alert(`Access granted/extended until ${newExpiryDate.toLocaleDateString()}!`);

    // 6. Acknowledge the purchase with Google Play by calling finish()
    // This prevents refunds for non-renewing/non-consumable types.
    console.log(`Acknowledging (finishing) transaction ${transaction.transactionId}...`);
    transaction.finish();
}

// --- UI Refresh for Access --- (Ensure this function exists and updates based on ACCESS_EXPIRY_KEY)
function refreshAccessUI() {
    const expiryString = window.localStorage.getItem(ACCESS_EXPIRY_KEY);
    const accessStatusEl = document.getElementById('access-status'); // Add this element to your HTML
    if (accessStatusEl) {
        if (expiryString) {
            const expiryDate = new Date(expiryString);
            if (expiryDate > new Date()) {
                accessStatusEl.textContent = `Access valid until: ${expiryDate.toLocaleDateString()}`;
            } else {
                accessStatusEl.textContent = 'Access expired.';
            }
        } else {
            accessStatusEl.textContent = 'No access.';
        }
    }
     // Also refresh product button states
    const product = CdvPurchase.store.get('non_renewing_sub_1_month'); // Use your product ID
    if (product) refreshProductUI(product); // Assuming refreshProductUI exists
}

// Call refreshAccessUI on startup too
document.addEventListener('deviceready', refreshAccessUI);
```

---

**Build and Test (Android/Google Play Non-Renewing)**

Follow the standard Android testing procedure:

1.  **Create Release Build:** Sign with your release keystore.
2.  **Upload to Play Console:** Upload to Internal/Closed testing. Add testers. Roll out.
3.  **Prepare Test Device:** Physical device, *only* tester Google account active. Install from Play Store via test link.
4.  **Run & Monitor:** Launch app, use `adb logcat`.
5.  **Test Purchase:**
    *   Verify initial UI (access expired/no access, product details, button).
    *   Tap "Subscribe" / "Extend Access".
    *   Confirm in Google Play dialog ("Test card...").
    *   Observe logs: `approved`, `verified` (if validator set), `Granting access...`, `Calculated New Expiry...`, `Acknowledging (finishing)...`, `finished`.
    *   Verify UI updates with the correct expiry date.
    *   **Restart app:** Ensure expiry persists.
    *   **Test Extension:** Purchase again (if desired) and verify expiry date extends correctly.

---

This handles the non-renewing subscription flow on Android, ensuring the purchase is acknowledged via `transaction.finish()` while your application manages the entitlement period based on the calculated expiry date.