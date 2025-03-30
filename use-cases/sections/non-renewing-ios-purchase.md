### Purchase Flow (iOS/App Store Non-Renewing Subscription)

Handling non-renewing subscriptions on iOS/App Store involves acknowledging the purchase and, crucially, calculating and storing the access duration within your application logic, as Apple does not manage this period.

**Step 1: Implement the Purchase Action**

*   **What:** Implement the function called by your "Subscribe" or "Extend Access" button (let's call it `window.purchaseNonRenewing`) to initiate the order via `store.order()`.
*   **Why:** Starts the App Store purchase process for the non-renewing product.

Create this function in `www/js/index.js`:

```javascript
// In js/index.js

// Make globally accessible for button onclick
window.purchaseNonRenewing = function() {
    const productId = 'non_renewing_sub_1_month'; // <<< YOUR Non-Renewing Product ID
    console.log(`Purchase button clicked for non-renewing: ${productId}`);
    const { store, Platform } = CdvPurchase;

    const product = store.get(productId, Platform.APPLE_APPSTORE);
    const offer = product?.getOffer(); // Assuming a default offer

    if (offer) {
        console.log(`Initiating order for non-renewing offer: ${offer.id}`);
        // Optional: Update UI to show processing
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
                 console.error("Unexpected error during non-renewing order:", err);
                 // setState({ isPurchasing: false, error: 'Unexpected error' });
            });
    } else {
        console.error(`Cannot purchase: Product (${productId}) or offer not found.`);
        alert('Unable to purchase. Product details might still be loading.');
    }
}
```

**Step 2: Handle the "Approved" State -> Verify (Optional but Recommended)**

*   **What:** Add an `.approved()` listener. Verification is not strictly mandatory for *functionality* like consumables, but highly recommended for non-renewing subs to get an accurate `purchaseDate` from Apple's servers, which is crucial for calculating the expiry.
*   **Why:** An accurate start date ensures the user gets the correct access duration.

Add this within the `store.when()` chain in `initializeStore`:

```javascript
// Inside initializeStore() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);

        // Verify to get accurate purchaseDate, though not strictly required for unlock
        if (store.validator) {
            console.log('Verification pending for ' + transaction.transactionId);
            // setState({ isVerifying: true });
            transaction.verify();
        } else {
             console.warn("Receipt validator not configured. Using local date for expiry calculation.");
             // Proceed without verification, using potentially less accurate local date
             grantAccessAndFinish(transaction);
        }
    })
    // Add .verified() and .finished() next
```

**Step 3: Handle the "Verified" State (Recommended)**

*   **What:** Add a `.verified()` listener. Runs after successful validation.
*   **Why:** This provides the most reliable `purchaseDate`. Use this point to calculate expiry, grant access, and finish the transaction.

Add this within the `store.when()` chain:

```javascript
// Inside initializeStore() -> store.when() chain

    .verified(receipt => {
        console.log(`Receipt verified for transaction ${receipt.transactions[0]?.transactionId}`);
        // setState({ isVerifying: false });

        // Find the relevant transaction from the product ID
        const verifiedTransaction = receipt.transactions
            .find(t => t.products[0]?.id === 'non_renewing_sub_1_month'); // <<< YOUR Non-Renewing Product ID

        if (verifiedTransaction) {
            grantAccessAndFinish(verifiedTransaction);
        } else {
            console.error("Verified receipt didn't contain the expected non-renewing transaction?");
            receipt.finish(); // Finish anyway to clear queue if possible
        }
    })
    // Add .finished() next
```

**Step 4: Handle the "Finished" State**

*   **What:** Add a `.finished()` listener. Fires after `transaction.finish()` completes.
*   **Why:** Confirms acknowledgment with the App Store.

Add this within the `store.when()` chain:

```javascript
// Inside initializeStore() -> store.when() chain

    .finished(transaction => {
        console.log(`Transaction ${transaction.transactionId} finished for ${transaction.products[0]?.id}.`);
        // Access should already be granted. Update UI if needed.
        // setState({ isPurchasing: false, isVerifying: false });
        refreshAccessUI(); // You'll need a function to display access expiry
    });

// --- Final Initialization Call ---
store.initialize(...).then(...);
```

**Step 5: Implement Access Granting, Expiry Calculation, and Finishing**

*   **What:** Create the `grantAccessAndFinish` function. This calculates the expiry date based on the product's duration and the transaction's `purchaseDate`, stores this expiry date persistently, updates the UI, and calls `transaction.finish()`.
*   **Why:** This is the core logic for non-renewing subscriptions. Your app manages the entitlement period. `finish()` acknowledges the transaction with Apple.

Add this new function to `www/js/index.js`:

```javascript
// In js/index.js

// Key for storing expiry date
const ACCESS_EXPIRY_KEY = 'myServiceAccessExpiry';

function grantAccessAndFinish(transaction) {
    const productId = transaction.products[0]?.id;
    console.log(`Granting access for non-renewing subscription ${productId}, transaction ${transaction.transactionId}...`);

    // 1. Determine duration based on productId (e.g., from a config map)
    let durationMonths = 0;
    if (productId === 'non_renewing_sub_1_month') { // <<< YOUR Non-Renewing Product ID
        durationMonths = 1;
    } else if (productId === 'non_renewing_sub_1_year') {
        durationMonths = 12;
    } // Add other durations as needed

    if (durationMonths === 0) {
        console.error(`Unknown duration for product ${productId}. Cannot grant access.`);
        transaction.finish(); // Finish anyway to clear the queue
        return;
    }

    // 2. Get purchase date (use verified date if available, else fallback)
    // The purchaseDate from a VERIFIED transaction is more reliable.
    const purchaseDate = transaction.purchaseDate || new Date(); // Fallback to current time if date missing

    // 3. Calculate new expiry date
    // Check existing expiry first if extending access is allowed
    const currentExpiryStr = window.localStorage.getItem(ACCESS_EXPIRY_KEY);
    let currentExpiry = currentExpiryStr ? new Date(currentExpiryStr) : new Date(0);
    // Start new duration from now or from the end of current access, whichever is later
    const startDate = Math.max(Date.now(), currentExpiry.getTime());
    const newExpiryDate = new Date(startDate);
    newExpiryDate.setMonth(newExpiryDate.getMonth() + durationMonths);

    console.log(`Purchase Date: ${purchaseDate.toISOString()}`);
    console.log(`Current Expiry: ${currentExpiry.toISOString()}`);
    console.log(`Calculated New Expiry: ${newExpiryDate.toISOString()} (Duration: ${durationMonths} months)`);

    // 4. Store the new expiry date persistently
    window.localStorage.setItem(ACCESS_EXPIRY_KEY, newExpiryDate.toISOString());

    // 5. Refresh UI to show updated access period
    refreshAccessUI(); // Implement this function
    alert(`Access granted/extended until ${newExpiryDate.toLocaleDateString()}!`);

    // 6. Finish the transaction with the App Store
    console.log(`Finishing transaction ${transaction.transactionId}...`);
    transaction.finish();
}

// --- UI Refresh for Access ---
// You need a function to display the expiry date
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

*   **Important:** You need to add an element with `id="access-status"` to your HTML to display the expiry information. The `refreshProductUI` function (from the generic section) should also be adapted if you want the purchase button label to change (e.g., "Extend Access" instead of "Subscribe").

---

**Build and Test (iOS/App Store Non-Renewing)**

Follow the standard iOS testing procedure:

1.  **Prepare & Build:** `cordova prepare ios`, then open and build in Xcode.
2.  **Sandbox Tester:** Ensure device is signed out of App Store, use Sandbox account when prompted by the app.
3.  **Run:** Launch from Xcode on a physical device.
4.  **Test Purchase:**
    *   Tap the "Subscribe" (or "Extend Access") button.
    *   Sign in with Sandbox Tester.
    *   Confirm purchase.
    *   Observe logs: `approved`, `verified` (if validator set), `Granting access...`, `Calculated New Expiry...`, `Finishing transaction...`, `finished`.
    *   Verify the UI updates to show the calculated expiry date in the `#access-status` element.
    *   **Restart the app:** Confirm the expiry date persists.
    *   **Test Extension:** If applicable, purchase the same item again and verify the expiry date is correctly extended from the *previous* expiry date or *now*, whichever is later.

---

This flow handles non-renewing subscriptions on iOS/App Store by relying on your application to manage the entitlement period after acknowledging the purchase with Apple via `transaction.finish()`.
