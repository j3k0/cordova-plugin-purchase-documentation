## Code Implementation

This section details the minimal code required to implement a non-consumable product (like unlocking a feature or removing ads) on iOS and macOS using the AppStore platform.

### Base framework

First, let's set up the basic HTML structure and the initial JavaScript to load the plugin.


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

Now, we'll initialize the plugin, register our non-consumable product, and set up the UI to display its status and purchase options. This involves:
*   Registering the product with type `NON_CONSUMABLE`.
*   Displaying product details (title, description, price).
*   Showing a "Buy" or "Unlock" button only when the product `canPurchase`.
*   Reflecting the unlocked status in the UI (e.g., showing the premium feature or hiding ads).

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
*Initial HTML modification suggestion for `./use-cases/sections/non-consumable-generic-initialization.md`: Adapt the example to unlock a feature instead of granting gold coins. For instance, show a "Feature Locked/Unlocked" status and a purchase button to unlock it.*

### Purchase Flow

Finally, we need to handle the purchase events triggered when the user buys the non-consumable product. This typically involves:
*   Initiating the order when the "Buy/Unlock" button is clicked.
*   Verifying the transaction with the receipt validator upon approval (optional but recommended).
*   Finishing the transaction once approved (or verified) to grant access permanently.
*   Updating the UI to reflect the unlocked status.

### Purchase Flow (iOS/App Store Non-Consumable)

Now that the store is initialized and the product is displayed, let's implement the logic to handle the actual purchase when the user clicks the "Unlock Now!" button.

**Step 1: Implement the Purchase Action**

*   **What:** Fill in the `window.purchaseFeature` function (defined as a stub previously) to call `store.order()`.
*   **Why:** This initiates the purchase process with the App Store when the user clicks the button.

Replace the placeholder `window.purchaseFeature` function in `www/js/index.js` with this implementation:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.purchaseFeature = function() {
    const productId = 'nonconsumable1'; // Use the SAME product ID you registered
    console.log(`Purchase button clicked for ${productId}`);
    const { store, Platform } = CdvPurchase; // Get Platform enum if needed

    // Ensure we target the correct platform product
    const product = store.get(productId, Platform.APPLE_APPSTORE); // Explicitly get AppStore version
    const offer = product?.getOffer(); // Get the default offer

    if (offer) {
        console.log(`Initiating order for offer: ${offer.id} on platform ${offer.platform}`);
        // Optional: Update UI to show a loading/processing state
        // setState({ isPurchasing: true });

        store.order(offer)
            .then(result => {
                // Order initiation was successful or user cancelled.
                // Actual purchase completion is handled by event listeners.
                // We might clear the loading state here ONLY IF the promise
                // resolves immediately after user interaction (cancel/confirm).
                // If it waits for final approval, loading state should be
                // cleared in the event handlers.

                // Check if the result is specifically a user cancellation error
                if (result && result.code === store.ErrorCode.PAYMENT_CANCELLED) {
                    console.log("User cancelled the purchase.");
                    // Optionally update UI, e.g., setState({ isPurchasing: false });
                } else if (result && result.isError) {
                    // Handle other potential initiation errors (rare)
                    console.error("Order initiation failed: " + result.message);
                    // Optionally update UI, e.g., setState({ isPurchasing: false, error: result.message });
                } else {
                    console.log("Order initiated. Waiting for approval...");
                    // UI state like 'isPurchasing' might remain true until approved/failed event
                }
            })
            .catch(err => {
                 // This catch might not be strictly necessary if .then handles errors,
                 // but good for robustness.
                 console.error("Unexpected error during order initiation:", err);
                 // Optionally update UI, e.g., setState({ isPurchasing: false, error: 'Unexpected error' });
            });

    } else {
        console.error(`Cannot purchase feature: Product (${productId}) or its offer not found or not loaded yet.`);
        alert('Unable to purchase. Product details might still be loading or the product ID is incorrect.');
    }
}
```

*   **Note:** We explicitly get the product for `Platform.APPLE_APPSTORE` to be precise, though `store.get(productId)` might work if it's the only platform initialized.

**Step 2: Handle the "Approved" State**

*   **What:** Add an `.approved()` listener using `store.when()`. This is triggered when the App Store confirms the user has authorized the payment (e.g., via Face ID, Touch ID, or password).
*   **Why:** This is the first confirmation that the purchase is likely to succeed. At this point, it's highly recommended (though optional if you skip validation) to verify the transaction's receipt.

Add the `.approved()` handler within the `store.when()` chain in your `initializeStore` function:

```javascript
// Inside initializeStore() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);

        // If you have a validator URL configured, verify the purchase.
        if (store.validator) {
            console.log('Verification pending for ' + transaction.transactionId);
            // Optional: Update UI to indicate verification is in progress
            // setState({ isVerifying: true });
            transaction.verify(); // Initiate verification
        }
        // If you don't have a validator, you might grant access here
        // BUT THIS IS NOT RECOMMENDED FOR NON-CONSUMABLES OR SUBSCRIPTIONS.
        // For this example, we'll assume verification happens or is skipped,
        // and the final unlock happens in the .verified() or directly
        // before calling .finish() if verification is skipped.
        else {
             console.warn("Receipt validator not configured. Finishing purchase without server verification.");
             // Directly call the function that grants access and finishes.
             unlockFeatureAndFinish(transaction);
        }
    })
    // Add .verified() and .finished() next
```

**Step 3: Handle the "Verified" State (Recommended)**

*   **What:** Add a `.verified()` listener. This is triggered *after* the `transaction.verify()` call completes successfully (meaning your validation server confirmed the receipt with Apple).
*   **Why:** This is the most secure point to grant the user entitlement. You know the purchase is legitimate and recorded by Apple.

Add the `.verified()` handler within the `store.when()` chain:

```javascript
// Inside initializeStore() -> store.when() chain

    .verified(receipt => {
        console.log(`Receipt verified for transaction ${receipt.transactions[0]?.transactionId}`);
        // Optional: Update UI to clear any "verifying" state
        // setState({ isVerifying: false });

        // Find the specific transaction within the receipt that was just verified.
        // This is important if a receipt contains multiple transactions.
        // For a simple non-consumable purchase, often the last transaction is the relevant one.
        const verifiedTransaction = receipt.transactions
            .find(t => t.products[0]?.id === 'nonconsumable1'); // Use your product ID

        if (verifiedTransaction) {
            // Unlock the feature and finish the transaction
            unlockFeatureAndFinish(verifiedTransaction);
        } else {
            console.error("Verified receipt didn't contain the expected transaction?");
        }
    })
    // Add .finished() next
```

**Step 4: Handle the "Finished" State**

*   **What:** Add a `.finished()` listener. This is triggered after `transaction.finish()` is called successfully.
*   **Why:** Confirms that the transaction is fully completed and acknowledged with the App Store. Usually, major UI updates or state changes happen before calling `finish`, but this is a good place for final cleanup or logging if needed.

Add the `.finished()` handler within the `store.when()` chain:

```javascript
// Inside initializeStore() -> store.when() chain

    .finished(transaction => {
        console.log(`Transaction ${transaction.transactionId} finished for ${transaction.products[0]?.id}.`);
        // The feature should already be unlocked.
        // You might refresh the UI one last time if needed.
        refreshFeatureUI();
    });
```

**Step 5: Implement the Feature Unlock and Finish Logic**

*   **What:** Create the `unlockFeatureAndFinish` function called by the `.approved()` (if no validator) or `.verified()` handlers. This function will update your application state (e.g., `localStorage`) to mark the feature as unlocked and then call `transaction.finish()`.
*   **Why:** This separates the logic for granting the entitlement from the event handling. Crucially, `transaction.finish()` tells the App Store that you have processed the transaction, preventing it from being delivered again.

Add this new function to `www/js/index.js`:

```javascript
// In js/index.js

function unlockFeatureAndFinish(transaction) {
    // Make sure we haven't already processed this transaction
    const isUnlocked = window.localStorage.getItem(FEATURE_KEY) === 'YES';
    if (isUnlocked) {
        console.log(`Feature already unlocked, finishing transaction ${transaction.transactionId} again just in case.`);
    } else {
        console.log(`Unlocking feature for transaction ${transaction.transactionId}...`);
        // Persist the unlock status
        window.localStorage.setItem(FEATURE_KEY, 'YES');
        // Refresh the UI immediately to show the unlocked state
        refreshFeatureUI();
        alert('Feature Unlocked! Thank you for your purchase.');
    }

    // Finish the transaction!
    // This acknowledges the purchase with the App Store. Required for non-consumables.
    console.log(`Finishing transaction ${transaction.transactionId}...`);
    transaction.finish();
}
```

### Build and Test (iOS/App Store)

Now that the initialization, UI, and purchase flow logic are in place, let's build the app and test it on a real device using a Sandbox Tester account.

**1. Prepare the Cordova Project:**

*   Ensure all your code changes in `www/js/index.js` and `www/index.html` are saved.
*   From your project's root directory in the terminal, run:
    ```bash
    cordova prepare ios
    ```
    This command updates the native Xcode project in the `platforms/ios` directory with your latest web assets.

**2. Open the Project in Xcode:**

*   Open the generated Xcode project:
    ```bash
    open platforms/ios/*.xcodeproj
    ```

**3. Configure Signing and Device:**

*   In Xcode, select your project in the left sidebar.
*   Go to the "Signing & Capabilities" tab for your App Target.
*   Ensure a valid "Team" is selected and that appropriate Signing Certificates (Development) are configured. Xcode might prompt you to fix issues if this is not set up.
*   Connect your physical iOS test device via USB.
*   Select your connected device from the device list near the top of the Xcode window (next to the Run/Stop buttons). **Do not use a Simulator**, as they don't fully support In-App Purchases.

**4. Prepare Sandbox Tester:**

*   On your **test device**, go to `Settings` -> `App Store`.
*   Scroll down to the **Sandbox Account** section.
*   **Sign Out** of any existing account. **Do not sign in yet.** You will sign in when the app prompts you during the purchase.
*   Make sure you have created a Sandbox Tester account in App Store Connect (as described in the [Setup Guide](!UNRESOLVED-LINK:./sections/setup-ios-6-test-users.md)).

**5. Run the App:**

*   Click the **Run** button (the ▶ icon) in Xcode. This will build the app and install it on your connected device.
*   Xcode's console will open at the bottom – keep an eye on this for log messages from both the native plugin and your JavaScript `console.log` statements.

**6. Test the Purchase:**

*   Once the app launches, observe the logs and the UI.
    *   You should see "Initializing store..." and "Store initialized successfully".
    *   The feature status should initially show "Locked".
    *   The product details should load, showing the title, description, and price, along with the "Unlock Now!" button (assuming `canPurchase` becomes true).
*   Tap the **"Unlock Now!"** button.
*   An App Store sheet should appear, prompting you to confirm the purchase and **sign in**.
*   **Enter the email and password for your Sandbox Tester account.**
*   Confirm the purchase (it will show "[Environment: Sandbox]").
*   Observe the Xcode console logs. You should see messages corresponding to:
    *   `Transaction ... approved...`
    *   `(If validator set) Verification pending...`
    *   `(If validator set) Receipt verified...`
    *   `Unlocking feature...`
    *   `Finishing transaction...`
    *   `Transaction ... finished...`
*   The UI should update:
    *   The "Feature Status" should change to "UNLOCKED! 🎉".
    *   The "Unlock Now!" button should be replaced with "_(Already Purchased)_".
*   **Restart the app:** Close it completely (swipe up from the app switcher) and reopen it. Verify that the "Feature Status" still shows "UNLOCKED! 🎉" (confirming persistence in `localStorage`) and the purchase button remains disabled.

