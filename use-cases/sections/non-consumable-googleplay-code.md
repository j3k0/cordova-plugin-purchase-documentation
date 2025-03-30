## Code Implementation

This section describes the minimal code required to implement a non-consumable product (e.g., remove ads, unlock premium features) on Android using the Google Play platform.

### Base framework

First, we set up the basic HTML structure and the initial JavaScript to load the plugin.


#### index.html

Assuming you're starting from a blank project, we'll add the minimal amount of HTML for the purpose of this tutorial. Let's replace the `<body>` from the `www/index.html` file with the below.

```markup
<body>
  <div id="app"></div>
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
```

Let's also make sure to comment out Cordova template project's CSS.

You also need to enable the `'unsafe-inline'` `Content-Security-Policy` by adding it to the `default-src` section:

```markup
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self' 'unsafe-inline' [...]" />
```

You can download the [full index.html file here](https://gist.github.com/j3k0/80c69837e5bacf83c4fc2320ba2e5dc2).
#### javascript


We will now create a new JavaScript file and load it from the HTML. The code below will initialize the plugin.

{% code lineNumbers="true" %}
```javascript
// Wait for Cordova to be ready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
  console.log('Device is ready.');

  // Check if the CdvPurchase plugin is available
  if (!window.CdvPurchase || !window.CdvPurchase.store) {
      console.error('CdvPurchase plugin is not available. Ensure it is installed and loaded correctly.');
      document.getElementById('app').innerHTML = 'Error: Purchase plugin not found.';
      return;
  }

  // Alias the store object for easier access
  const { store, LogLevel, ErrorCode } = CdvPurchase;
  console.log('CdvPurchase.store object found, version ' + store.version);

  // Optional: Set the verbosity level for debugging
  // LogLevel.DEBUG provides the most detailed logs
  store.verbosity = LogLevel.DEBUG;

  // Setup a global error handler for the store
  store.error(function(error) {
      console.error('STORE ERROR: Code=' + error.code + ' Message=' + error.message);
      // Display the error to the user in a dedicated element
      const errorEl = document.getElementById('error-display'); // Ensure this element exists in your HTML
      if (errorEl) {
          errorEl.textContent = 'Error: ' + error.message;
          // Optionally clear the error after a few seconds
          setTimeout(() => { if (errorEl.textContent === 'Error: ' + error.message) errorEl.textContent = ''; }, 8000);
      }
  });

  // Setup a listener for when the store is ready
  // This guarantees that initialize() has completed successfully
  store.ready(function() {
    console.log("CdvPurchase store is ready.");
    // Initial UI refresh after the store is ready
    refreshUI();
  });

  // Initialize the store and related components
  initializeStore();

  // Perform an initial UI refresh (might show loading states)
  refreshUI();
}

function initializeStore() {
  console.log('Calling initializeStore()...');
  const { store } = CdvPurchase; // Get store instance again

  // TODO: Register products using store.register([...])
  console.log('Registering products...');
  // store.register([...]); // Add your product registrations here

  // TODO: Set the validator URL or function
  console.log('Setting validator...');
  // store.validator = "YOUR_VALIDATOR_URL";

  // TODO: Setup event listeners using store.when()...
  console.log('Setting up event listeners...');
  // store.when()...

  // TODO: Call store.initialize([...platforms])
  console.log('Calling store.initialize()...');
  // store.initialize([...]);
}

function refreshUI() {
  console.log('Calling refreshUI()...');
  // TODO: Implement UI updates based on product/purchase status
  // This function will be called by event listeners and after initialization.
  const appEl = document.getElementById('app');
  if (appEl) {
      // Example: Display loading state or initial content
      // appEl.innerHTML = '<p>Store is initializing...</p>';
  } else {
      console.error('App element not found for UI refresh.');
  }
}
```
{% endcode %}

Here's a little explanation:

**Line 1**, it's important to wait for the "deviceready" event before using cordova plugins.

**Lines 5-8**, we check if the plugin was correctly loaded.

**Lines 11-13**, we setup an error handler. It just logs errors to the console.

> Whatever your setup is, you should make sure this runs as soon as the javascript application starts. You have to be ready to handle IAP events as soon as possible.

### Initialization & Presentation

Next, we initialize the plugin, register our non-consumable product, and set up the UI. This involves:
*   Registering the product with type `NON_CONSUMABLE`.
*   Displaying product details (title, description, price).
*   Showing a "Buy" or "Unlock" button only when the product `canPurchase`.
*   Checking the `product.owned` status to reflect whether the feature is unlocked in the UI.

### Initialization

Let's set up the basic HTML and JavaScript structure.

**HTML (`index.html` body):**

```html
<body>
  <div class="app">
    <!-- Status messages will go here -->
    <div id="messages">Loading...</div>
    <!-- Product details and purchase button -->
    <div id="product-details">Please wait...</div>
  </div>
  <script type="text/javascript" src="cordova.js"></script>
  <script type="text/javascript" src="js/index.js"></script>
</body>
```

**JavaScript (`index.js` or equivalent):**

```javascript
document.addEventListener('deviceready', initStore, false);

// Placeholder Product ID - REPLACE THIS with your actual Product ID
const MY_PRODUCT_ID = 'nonconsumable1';

function initStore() {

    const { store, ProductType, Platform, ErrorCode } = CdvPurchase;

    if (!store) { // Ensure the store object is available
        log('Store not available');
        return;
    }

    // Log all errors
    store.error(error => {
        log('ERROR ' + error.code + ': ' + error.message);
        updateMessages('Error: ' + error.message);
    });

    // Register the non-consumable product
    store.register({
        id: MY_PRODUCT_ID,
        type: ProductType.NON_CONSUMABLE,
        platform: store.defaultPlatform() // Or specify Platform.APPLE_APPSTORE, Platform.GOOGLE_PLAY
    });

    // Setup the validator (RECOMMENDED)
    // store.validator = "YOUR_VALIDATOR_URL";
    // store.validator = new CdvPurchase.Iaptic({...}).validator;

    // Setup event listeners
    store.when()
      .productUpdated(renderProduct) // Render the product UI when its data is available/updated
      .approved(transaction => {
          log('Approved: ' + transaction.products[0].id);
          // If using validation:
          if (store.validator) {
              updateMessages('Purchase approved. Verifying...');
              transaction.verify();
          } else {
              // WARNING: No validation - insecure for non-consumables
              log('WARNING: Skipping receipt validation.');
              updateMessages('Purchase approved. Finishing...');
              grantEntitlement(transaction.products[0].id);
              transaction.finish();
          }
      })
      .verified(receipt => {
          log('Verified: ' + receipt.id);
          updateMessages('Purchase verified. Finishing...');
          // Grant entitlement based on the verified purchase
          receipt.collection.forEach(purchase => grantEntitlement(purchase.id));
          receipt.finish(); // IMPORTANT: Finish the transaction
      })
      .unverified(unverifiedReceipt => {
          log('Purchase not verified.');
          updateMessages('Purchase failed verification.');
          // Decide how to handle failed verification (e.g., deny entitlement, retry?)
      })
      .finished(transaction => {
          log('Finished: ' + transaction.transactionId);
          updateMessages('Purchase complete!');
          renderUI(); // Ensure UI reflects the final owned state
      });

    // Initialize the store
    updateMessages('Initializing Store...');
    store.initialize([store.defaultPlatform()])
      .then(() => {
          log('Store initialized');
          updateMessages('Store ready.');
          renderUI();
      });
}

// --- Placeholder Functions (Implement in your main use-case file) ---

function renderProduct(product) {
    // Find the element to update
    const el = document.getElementById('product-details');
    if (!el) return;

    // Basic rendering - customize this in your use-case file
    log('Rendering product: ' + product.id);
    let html = `<h3>${product.title}</h3><p>${product.description}</p>`;
    const offer = product.getOffer();
    if (offer) {
        html += `<p>Price: ${offer.pricingPhases[0].price}</p>`;
        if (offer.canPurchase) {
            html += `<button onclick="requestPurchase('${product.platform}', '${product.id}', '${offer.id}')">Buy</button>`;
        } else if (product.owned) {
            html += `<p>(Already Owned)</p>`;
        } else {
            html += `<p>(Cannot Purchase)</p>`;
        }
    } else {
        html += `<p>Loading price...</p>`;
    }
    el.innerHTML = html;
}

function renderUI() {
    // This function should update the overall UI based on ownership state.
    // Implement the specific logic in your main use-case file.
    log('Rendering main UI...');
    // Example: Check ownership and update a status message or unlock UI elements
    const owned = CdvPurchase.store.owned(MY_PRODUCT_ID);
    updateMessages(owned ? 'Product Owned' : 'Product Not Owned');
}

function grantEntitlement(productId) {
    // This function grants access to the purchased content/feature.
    // Implement the specific logic in your main use-case file.
    log('Granting entitlement for: ' + productId);
    // Example: Set a flag in secure storage, update user profile on backend, etc.
}

function requestPurchase(platform, productId, offerId) {
    // This function initiates the purchase flow.
    log(`Requesting purchase: ${platform}, ${productId}, ${offerId}`);
    const offer = CdvPurchase.store.get(productId, platform)?.getOffer(offerId);
    if (offer) {
        updateMessages('Initiating purchase...');
        offer.order().then(error => {
            if (error) {
                if (error.code === CdvPurchase.ErrorCode.PAYMENT_CANCELLED) {
                    updateMessages('Purchase cancelled.');
                } else {
                    updateMessages(`Purchase failed: ${error.message}`);
                }
            } else {
                // Purchase flow initiated, waiting for 'approved' or 'cancelled'/'failed'
                updateMessages('Purchase flow started...');
            }
        });
    } else {
        updateMessages('Offer not found for purchase.');
    }
}

function updateMessages(text) {
    // Helper to show status messages
    const el = document.getElementById('messages');
    if (el) el.textContent = text;
}

// Simple log function for the example
function log(msg) {
    console.log('[Store Init] ' + msg);
}

// Initial UI update on device ready
document.addEventListener('deviceready', renderUI, false);

```
*Initial HTML modification suggestion for `./use-cases/sections/non-consumable-generic-initialization.md`: Adapt the example to reflect unlocking a feature. Instead of `window.localStorage.goldCoins`, use something like `window.localStorage.featureUnlocked = "YES"` and update the UI based on this flag.*

### Purchase Flow

Finally, we handle the purchase events. For non-consumables on Google Play, the key is to **acknowledge** the purchase to prevent automatic refunds.
*   Initiate the order when the "Buy/Unlock" button is clicked.
*   Handle the `approved` state. Verification is optional but highly recommended to prevent fraud.
*   **Acknowledge** the purchase by calling `transaction.finish()`. This confirms delivery to Google Play. **Do not consume** non-consumable products.
*   Update your application state (e.g., set `window.localStorage.featureUnlocked = "YES"`) and refresh the UI.

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