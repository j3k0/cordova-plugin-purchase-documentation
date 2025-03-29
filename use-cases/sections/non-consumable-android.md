### Purchase Flow (Android/Google Play Non-Consumable)

With the store initialized and product details displayed, we now implement the purchase logic specific to Google Play for non-consumable items. The key difference on Android is the need to **acknowledge** the purchase within 3 days to prevent automatic refunds.

**Step 1: Implement the Purchase Action**

*   **What:** Fill in the `window.purchaseFeature` function stub (created in the generic section) to call `store.order()` for the Google Play platform.
*   **Why:** This triggers the Google Play purchase dialog when the user clicks the "Unlock Now!" button.

Replace the placeholder `window.purchaseFeature` function in `www/js/index.js` with this implementation:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.purchaseFeature = function() {
    const productId = 'nonconsumable1'; // Use the SAME product ID you registered
    console.log(`Purchase button clicked for ${productId}`);
    const { store, Platform } = CdvPurchase; // Get Platform enum

    // Ensure we target the correct platform product
    const product = store.get(productId, Platform.GOOGLE_PLAY); // Explicitly get Google Play version
    const offer = product?.getOffer(); // Get the default offer

    if (offer) {
        console.log(`Initiating order for offer: ${offer.id} on platform ${offer.platform}`);
        // Optional: Update UI to show a loading/processing state
        // setState({ isPurchasing: true });

        store.order(offer)
            .then(result => {
                // Order initiation successful or user cancelled.
                // Completion is handled by event listeners.
                if (result && result.code === store.ErrorCode.PAYMENT_CANCELLED) {
                    console.log("User cancelled the purchase via Google Play.");
                    // Optionally update UI, e.g., setState({ isPurchasing: false });
                } else if (result && result.isError) {
                    console.error("Order initiation failed: " + result.message);
                    // Optionally update UI, e.g., setState({ isPurchasing: false, error: result.message });
                } else {
                    console.log("Order initiated with Google Play. Waiting for approval...");
                    // UI state like 'isPurchasing' might remain true
                }
            })
            .catch(err => {
                 console.error("Unexpected error during order initiation:", err);
                 // Optionally update UI, e.g., setState({ isPurchasing: false, error: 'Unexpected error' });
            });

    } else {
        console.error(`Cannot purchase feature: Product (${productId}) or its offer not found or not loaded yet.`);
        alert('Unable to purchase. Product details might still be loading or the product ID is incorrect.');
    }
}
```

**Step 2: Handle the "Approved" State**

*   **What:** Add an `.approved()` listener. This fires when the Google Play Billing library indicates the payment has been processed successfully on Google's side, but before your app has acknowledged it.
*   **Why:** This is the signal to verify the purchase (if using a validator) or proceed directly to acknowledging it.

Add the `.approved()` handler within the `store.when()` chain in your `initializeStore` function:

```javascript
// Inside initializeStore() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);

        // Verification is recommended for security.
        if (store.validator) {
            console.log('Verification pending for ' + transaction.transactionId);
            // Optional: Update UI to indicate verification
            // setState({ isVerifying: true });
            transaction.verify();
        } else {
             console.warn("Receipt validator not configured. Finishing purchase without server verification.");
             // Acknowledge directly if no validator
             acknowledgeFeatureAndFinish(transaction);
        }
    })
    // Add .verified() and .finished() next
```

**Step 3: Handle the "Verified" State (Recommended)**

*   **What:** Add a `.verified()` listener. This is called after successful validation via `transaction.verify()`.
*   **Why:** Confirms the purchase is legitimate according to your server. This is the ideal point to grant entitlement and acknowledge the purchase to Google.

Add the `.verified()` handler within the `store.when()` chain:

```javascript
// Inside initializeStore() -> store.when() chain

    .verified(receipt => {
        console.log(`Receipt verified for transaction ${receipt.transactions[0]?.transactionId}`);
        // Optional: Update UI
        // setState({ isVerifying: false });

        // Find the relevant transaction
        const verifiedTransaction = receipt.transactions
            .find(t => t.products[0]?.id === 'nonconsumable1'); // Use your product ID

        if (verifiedTransaction) {
            acknowledgeFeatureAndFinish(verifiedTransaction);
        } else {
            console.error("Verified receipt didn't contain the expected transaction?");
        }
    })
    // Add .finished() next
```

**Step 4: Handle the "Finished" State**

*   **What:** Add a `.finished()` listener. This fires after `transaction.finish()` successfully acknowledges the purchase with Google Play.
*   **Why:** Indicates the transaction is fully complete in the Google Play system. Useful for final UI updates or logging.

Add the `.finished()` handler within the `store.when()` chain:

```javascript
// Inside initializeStore() -> store.when() chain

    .finished(transaction => {
        console.log(`Transaction ${transaction.transactionId} finished (acknowledged) for ${transaction.products[0]?.id}.`);
        // Feature should already be unlocked. Refresh UI to be sure.
        refreshFeatureUI();
    });
```

**Step 5: Implement Feature Unlock and Acknowledge Logic**

*   **What:** Create the `acknowledgeFeatureAndFinish` function. This function updates your app's state (`localStorage`) to unlock the feature and calls `transaction.finish()` to acknowledge the purchase with Google Play.
*   **Why:** You **must** acknowledge non-consumable purchases on Google Play within 3 days, otherwise Google will automatically refund the user. Calling `transaction.finish()` performs this acknowledgment. **Do not consume non-consumables.**

Add this new function to `www/js/index.js`:

```javascript
// In js/index.js

function acknowledgeFeatureAndFinish(transaction) {
    // Grant the entitlement if not already granted
    const isUnlocked = window.localStorage.getItem(FEATURE_KEY) === 'YES';
    if (isUnlocked) {
        console.log(`Feature already unlocked, acknowledging transaction ${transaction.transactionId} again just in case.`);
    } else {
        console.log(`Unlocking feature for transaction ${transaction.transactionId}...`);
        // Persist the unlock status
        window.localStorage.setItem(FEATURE_KEY, 'YES');
        // Refresh the UI immediately
        refreshFeatureUI();
        alert('Feature Unlocked! Thank you.');
    }

    // Acknowledge the purchase with Google Play.
    // This is CRUCIAL for non-consumables on Android.
    console.log(`Acknowledging (finishing) transaction ${transaction.transactionId}...`);
    transaction.finish();
}
```

---

**Build and Test (Android/Google Play)**

Testing Google Play In-App Purchases requires specific steps:

**1. Create a Release Build:**

*   Google Play Billing often only works correctly with **release-signed APKs/AABs**. Debug builds usually fail.
*   You need a Java Keystore to sign your release build. If you don't have one, create it:
    ```bash
    keytool -genkey -v -keystore my-release-key.keystore -alias mykeyalias -keyalg RSA -keysize 2048 -validity 10000
    ```
    Remember the alias and passwords you set. **Back up this keystore file securely!**
*   Build the signed release APK. You can use Cordova CLI with a `build.json` or Android Studio. A helper script like `android-release.sh` (mentioned in setup section [setup-android-5-android-release-apk.md](!UNRESOLVED-LINK:./sections/setup-android-5-android-release-apk.md)) simplifies this:
    ```bash
    # Set environment variables or the script will prompt you
    export KEYSTORE_PATH=/path/to/my-release-key.keystore
    export KEYSTORE_ALIAS=mykeyalias
    # export KEYSTORE_PASSWORD=your_store_password # Optional, script prompts if not set
    # export KEY_PASSWORD=your_key_password       # Optional, script prompts if not set

    ./android-release.sh # Assuming you have the script from the setup guide
    ```
    This produces an APK like `android-release-YYYYMMDD-HHMM.apk`.

**2. Upload to Google Play:**

*   Go to the Google Play Console.
*   Navigate to your app.
*   Go to **Release -> Testing -> Internal testing** (or Closed testing).
*   Create a new release and **upload the signed release APK** you just built.
*   Add testers' Google account email addresses to the tester list for that track.
*   **Save and roll out** the release to your testers. It might take some time (minutes to hours) for the release to become available.

**3. Prepare Test Device:**

*   Use a **physical Android device**. Emulators are often unreliable for IAP testing.
*   Log into the device with a Google account that is listed as a **tester** in the Play Console for your internal/closed track. **Ensure this is the *only* Google account active on the device**, or the primary one, to avoid conflicts.
*   Make sure the Google Play Store app is up-to-date.

**4. Install and Run:**

*   Testers need to **accept the testing invitation** (usually via a link provided by the Play Console).
*   Install the app **from the Google Play Store** using the testing link, **not** by manually installing the APK via `adb install` (this often bypasses required Play Store initialization).
*   Alternatively, if you built an APK (not AAB), you can install the *release signed* APK directly for quick tests *after* having uploaded at least one version to Play Console:
    ```bash
    adb install -r path/to/android-release-....apk
    ```
*   Open the app.
*   Use `adb logcat` to monitor logs:
    ```bash
    adb logcat CordovaPurchase:D CordovaLog:D chromium:D *:S
    ```

**5. Test the Purchase:**

*   Navigate to the feature/product in your app.
*   Observe the logs and UI:
    *   Store initialization messages should appear.
    *   Feature status should be "Locked".
    *   Product details (title, price) should load, and the "Unlock Now!" button should appear.
*   Tap **"Unlock Now!"**.
*   The Google Play purchase sheet should appear. It might mention "Test card, always approves".
*   Confirm the purchase.
*   Observe Logcat and the app UI:
    *   `Transaction ... approved...` log.
    *   `(If validator set) Verification pending...` / `Receipt verified...` logs.
    *   `Unlocking feature...` log.
    *   `Acknowledging (finishing) transaction...` log.
    *   `Transaction ... finished...` log.
*   The UI should update to "Feature Status: UNLOCKED! 🎉", and the button should change to "_(Already Purchased)_".
*   **Restart the app:** Verify the unlocked status persists.

---

This completes the non-consumable purchase flow for Android. The key takeaway is the necessity of **acknowledging** the purchase using `transaction.finish()`.