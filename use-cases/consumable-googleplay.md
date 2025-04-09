# Consumable (Google Play)

This use case explains how to implement a **consumable** product (like virtual currency or extra lives) on Android using the Google Play platform and `cordova-plugin-purchase` v13+.

## 1. Platform Setup

First, ensure your Google Play Console, application build, and test environment are correctly configured for Google Play Billing.

⇒ [Setup instructions here](../setup/setup-googleplay.md).

## 2. Initialization & UI

Next, set up the basic JavaScript to initialize the plugin, register your consumable product, and display its information and the user's balance.

This section covers the initial setup and UI display for a **consumable** product (like virtual currency or game lives) using the `cordova-plugin-purchase` plugin (v13+). It focuses on registering the product and displaying its information, deferring the actual purchase logic to platform-specific guides.

**Assumptions:**

* You have completed the basic [Code Framework Setup](../setup/code-framework.md).
* You have created a consumable product in your target platform's developer console (App Store Connect or Google Play Console).

**Step 1: Implement `initializeStoreAndSetupListeners`**

Replace the placeholder `initializeStoreAndSetupListeners` function (from the initial JavaScript setup) with the following code. This function registers your consumable product, optionally sets up a validator, adds a listener to update the UI when product data loads, and initializes the store.

{% code title="www/js/index.js (initializeStoreAndSetupListeners)" lineNumbers="true" %}
```javascript
// This function should be called by onDeviceReady after basic setup
function initializeStoreAndSetupListeners() {
  console.log('Setting up store for Consumables...');
  setStatus('Initializing Store for Consumables...');

  const { store, ProductType, Platform, LogLevel } = CdvPurchase;

  // --- Product Definition ---
  // Define the consumable product ID you configured in the App/Play Store.
  const MY_CONSUMABLE_ID = 'consumable1'; // Replace with your actual ID

  // --- Register Product ---
  // Register the product with the store.
  store.register({
    id: MY_CONSUMABLE_ID,
    type: ProductType.CONSUMABLE,
    platform: store.defaultPlatform() // Or specify Platform.GOOGLE_PLAY, Platform.APPLE_APPSTORE
  });

  // --- Optional: Setup Receipt Validator ---
  // While less critical than for subscriptions, validating consumables
  // prevents simple fraud and ensures purchases are legitimate.
  // Replace with your actual validator URL or function.
  // store.validator = "https://your-validator.com/validate";
  // store.validator = new CdvPurchase.Iaptic({...}).validator; // Example using Iaptic helper

  // --- Setup Event Listeners ---
  store.when()
    .productUpdated(product => {
      // Called when product data is loaded or updated.
      console.log('Product updated: ' + product.id);
      // Store the product reference for later use if needed
      if (product.id === MY_CONSUMABLE_ID) {
        // myProductReference = product; // Store if needed globally
      }
      refreshUI(); // Update the UI with product details
    })
    // Purchase flow listeners (.approved, .verified, .finished, .cancelled)
    // will be added in the platform-specific purchase flow sections.
    // For now, we only need productUpdated for display purposes.
    ; // End of store.when() chain

  // --- Initialize the Store ---
  // Initialize the platform specified during registration.
  store.initialize([store.defaultPlatform()])
    .then(() => {
      console.log('Store initialized successfully.');
      setStatus('Store ready.');
      refreshUI(); // Render the UI with initial data
    })
    .catch(err => {
      console.error('Store initialization failed:', err);
      setStatus('Store failed to initialize.');
    });
}

// --- UI Rendering ---

// Example: Store balance in localStorage (INSECURE - use SecureStorage or backend!)
let userCoinBalance = 0;
const COIN_BALANCE_KEY = 'userCoinBalance';
const COINS_GRANTED = 100; // Example amount granted by MY_CONSUMABLE_ID

function loadBalance() {
  try {
    userCoinBalance = parseInt(window.localStorage.getItem(COIN_BALANCE_KEY) || '0');
  } catch (e) {
    console.error('Error loading balance: ' + e);
    userCoinBalance = 0;
  }
}
function saveBalance() {
  try {
    window.localStorage.setItem(COIN_BALANCE_KEY, userCoinBalance.toString());
  } catch (e) {
    console.error('Error saving balance: ' + e);
  }
}

// This function updates the UI based on product data and coin balance
function refreshUI() {
  loadBalance(); // Load the current balance
  console.log('Refreshing UI...');
  const { store, Platform } = CdvPurchase; // Get store instance

  const product = store.get(MY_CONSUMABLE_ID); // Get our registered product
  const productEl = document.getElementById('product-details'); // Target the product display area
  const balanceEl = document.getElementById('user-status'); // Target the balance display area

  if (balanceEl) {
    balanceEl.innerHTML = `<b>Coins: ${userCoinBalance}</b>`;
  }

  if (productEl) {
    if (!product) {
      productEl.innerHTML = '<p>Loading product details...</p>';
      return;
    }

    // Product loaded, display its details
    let productHtml = `
      <h3>${product.title}</h3>
      <p>${product.description}</p>
    `;
    const offer = product.getOffer(); // Get the default offer
    if (offer) {
      productHtml += `<p>Price: ${offer.pricing?.price ?? 'N/A'}</p>`;
      // Consumables can generally always be purchased if the offer is valid
      if (offer.canPurchase) {
        // The buyConsumable function will be implemented in platform-specific guides
        productHtml += `<button id="buy-button" onclick="buyConsumable()">Buy ${COINS_GRANTED} Coins</button>`;
      } else {
        productHtml += `<p>(Cannot purchase at this time)</p>`;
      }
    } else {
      productHtml += `<p>Pricing information not available.</p>`;
    }
    productEl.innerHTML = productHtml;
  }
}

// --- Placeholder for Purchase Action ---
// This will be implemented in the platform-specific guides (consumable-android.md, consumable-ios.md)
window.buyConsumable = function() {
  console.log('Placeholder: buyConsumable() called.');
  alert('Purchase logic needs to be implemented for the specific platform.');
};

// --- Placeholder for Granting Logic ---
// This will be implemented in the platform-specific guides
function grantCoins(amount) {
  console.log(`Placeholder: Granting ${amount} coins.`);
  userCoinBalance += amount;
  saveBalance();
  refreshUI();
}

// Initial UI update on device ready (after basic setup in index.js)
document.addEventListener('deviceready', () => {
  // Ensure the initial call to initializeStoreAndSetupListeners happens
  // This line assumes the function from code-initial-javascript.js is named this way
  if (typeof initializeStoreAndSetupListeners === 'function') {
     // Already called by onDeviceReady in the initial script
  } else {
     // Fallback if the structure differs
     initializeStoreAndSetupListeners = initializeStore; // Assign our function
     initializeStoreAndSetupListeners();
  }
  // Load initial balance and render
  loadBalance();
  refreshUI();
}, false);

// Ensure setStatus is defined (it should be in the initial script)
if (typeof setStatus !== 'function') {
  setStatus = (message) => console.log('[Status] ' + message);
}

```
{% endcode %}

**Explanation:**

1. **Product Definition (Line 9):** Define the `id` of your consumable product exactly as it appears in App Store Connect or Google Play Console.
2. **Register Product (Lines 13-17):** Call `store.register()` with the `id`, `type` set to `ProductType.CONSUMABLE`, and the correct `platform`.
3. **Validator Setup (Lines 20-24):** Optionally configure `store.validator` with your validation service URL. While not strictly mandatory for basic consumable functionality, it's recommended for security.
4. **Event Listeners (Lines 27-38):** Set up a listener for `productUpdated`. This event fires when the product's details (title, price, etc.) are loaded from the store. Inside the callback, we call `refreshUI()` to display this information. Purchase-related listeners (`approved`, `verified`, `finished`) will be added later.
5. **Initialize Store (Lines 41-50):** Call `store.initialize()` with the platform(s) you registered products for. This starts the connection to the store and begins loading product data.
6. **UI Rendering (Lines 54-100):**
   * The `refreshUI` function is responsible for displaying the product information and the user's current balance (e.g., number of coins).
   * It uses `store.get(MY_CONSUMABLE_ID)` to retrieve the loaded product data.
   * It displays the title, description, and price from the product's default `Offer`.
   * It shows a "Buy" button if `offer.canPurchase` is true. The `onclick` calls `buyConsumable()`, which will be implemented next.
   * It displays the user's coin balance (using `localStorage` here for simplicity – **use secure storage or a server backend in production**).
7. **Placeholders (Lines 103-113):** Empty functions `buyConsumable` and `grantCoins` are defined. Their specific implementation depends on the platform and will be covered in the next steps.
8. **Initial Load (Lines 116-126):** Ensures the initialization runs and the initial UI (including balance) is rendered when the device is ready.

This setup prepares your app to display the consumable product. The next steps involve implementing the platform-specific purchase flow (Android or iOS) to handle the actual buying process and granting the item.

* **Note:** Replace the placeholder product ID (`'consumable1'`) in the code with your actual Google Play Product ID. Adapt the `grantCoins` function and UI rendering (`refreshUI`) to match your specific consumable item. Remember to use secure storage instead of `localStorage` for balances in production. Also, update the `store.register` call within the included code to specify `Platform.GOOGLE_PLAY`.

## 3. Purchase Flow

Implement the logic to handle the purchase process when the user taps the "Buy" button. This involves initiating the order and handling the `approved`, `verified` (optional but recommended), and `finished` events to grant the item and **consume** the purchase using `transaction.finish()`.

### Purchase Flow (Android/Google Play Consumable)

This section implements the purchase logic for consumable items (like virtual currency) on Android using Google Play. The key step here is **consuming** the purchase using `transaction.finish()` after it's been granted to the user.

**Step 1: Implement the Purchase Action (`buyConsumable`)**

* **What:** Replace the placeholder `window.buyConsumable` function (from the generic initialization) to call `offer.order()` for the Google Play platform.
* **Why:** Initiates the Google Play purchase dialog when the user clicks the "Buy Coins" button.

Replace the placeholder `window.buyConsumable` function in `www/js/index.js`:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.buyConsumable = function() {
    const productId = 'consumable1'; // Use the SAME product ID you registered
    console.log(`Purchase button clicked for consumable: ${productId}`);
    const { store, Platform } = CdvPurchase; // Get Platform enum

    // Ensure we target the correct platform product
    const product = store.get(productId, Platform.GOOGLE_PLAY); // Explicitly get Google Play version
    const offer = product?.getOffer(); // Get the default offer

    if (offer) {
        console.log(`Initiating order for consumable offer: ${offer.id} on platform ${offer.platform}`);
        setStatus('Initiating purchase...');

        // For Android, you might pass obfuscated account/profile IDs for fraud prevention
        // const additionalData = { googlePlay: { accountId: 'hashed_user_id', profileId: 'hashed_profile_id' } };
        // store.order(offer, additionalData)
        offer.order()
            .then(result => {
                // This promise resolves when the purchase flow UI is dismissed (successfully or not).
                // The final outcome is handled by the .approved, .cancelled, or .error listeners.
                if (result && result.isError) {
                    // Handle potential errors during order initiation (rare)
                    setStatus(`Order failed: ${result.message}`);
                } else {
                    // Purchase flow started, waiting for events...
                    // Status message will be updated by listeners.
                }
                refreshUI(); // Refresh UI in case button state needs update
            })
            .catch(err => {
                 // Should generally not happen if store.error is set up
                 console.error("Unexpected error during consumable order:", err);
                 setStatus('Unexpected error during purchase.');
                 refreshUI();
            });

    } else {
        console.error(`Cannot purchase: Product (${productId}) or offer not found or not loaded yet.`);
        setStatus('Error: Unable to purchase. Product details missing.');
    }
}
```

**Step 2: Handle Purchase Events (`.approved`, `.verified`, `.finished`)**

* **What:** Add the purchase lifecycle event listeners within the `store.when()` chain in your `initializeStoreAndSetupListeners` function (created during generic initialization).
* **Why:** These listeners handle the progression of the purchase: approval by Google Play, optional verification, and finalization (consumption).

Add these handlers inside the existing `store.when()` call:

```javascript
// Inside initializeStoreAndSetupListeners() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);
        setStatus('Purchase approved. Verifying...');

        // Verification is recommended for security, even for consumables.
        if (store.validator) {
            transaction.verify();
        } else {
             console.warn("Receipt validator not configured. Granting consumable without server verification.");
             // Grant and consume directly if no validator.
             grantAndConsumeItem(transaction);
        }
    })
    .verified(receipt => {
        console.log(`Receipt verified for transaction ${receipt.transactions[0]?.transactionId}`);
        setStatus('Purchase verified. Finishing...');

        // Find the relevant transaction within the verified receipt
        const verifiedTransaction = receipt.transactions
            .find(t => t.products[0]?.id === MY_CONSUMABLE_ID); // Use your consumable product ID

        if (verifiedTransaction) {
            // Grant the item and CONSUME the transaction
            grantAndConsumeItem(verifiedTransaction);
        } else {
            console.error("Verified receipt didn't contain the expected consumable transaction?");
            // Finish anyway to clear the queue if possible
            receipt.finish();
        }
    })
    .finished(transaction => {
        console.log(`Transaction ${transaction.transactionId} finished (consumed) for ${transaction.products[0]?.id}.`);
        setStatus('Purchase complete! Coins granted.');
        // Item should already be granted. Update UI to allow repurchase.
        refreshUI(); // Refresh coin display & product UI
    })
    .cancelled(transaction => {
        console.log('Purchase Cancelled:', transaction.transactionId);
        setStatus('Purchase cancelled.');
        refreshUI();
    });
    // Ensure the .productUpdated listener from the generic setup is still present
```

**Step 3: Implement Granting and Consumption Logic (`grantAndConsumeItem`)**

* **What:** Replace the placeholder `grantAndConsumeItem` function. It updates the user's balance and calls `transaction.finish()`.
* **Why:** This function delivers the item. Crucially, for consumables on Google Play, calling `transaction.finish()` **triggers consumption** via the Billing Library's `consumeAsync`, making the item available for purchase again.

Replace the placeholder `grantAndConsumeItem` function in `www/js/index.js`:

```javascript
// In js/index.js

// Replace the placeholder function
function grantAndConsumeItem(transaction) {
    console.log(`Granting consumable for transaction ${transaction.transactionId}...`);

    // Determine quantity - Google Play supports multi-quantity, default to 1
    const quantity = transaction.quantity || 1;
    const coinsToAdd = COINS_GRANTED * quantity; // Use the constant defined earlier

    // Add item(s) to inventory/balance
    const currentCoins = parseInt(window.localStorage.getItem(COIN_BALANCE_KEY) || '0', 10);
    window.localStorage.setItem(COIN_BALANCE_KEY, (currentCoins + coinsToAdd).toString());

    console.log(`Added ${coinsToAdd} coins (Quantity: ${quantity}). New balance: ${currentCoins + coinsToAdd}`);

    // Refresh UI immediately (optional, .finished listener also calls refreshUI)
    // refreshUI();

    // Consume the purchase with Google Play by calling finish()
    console.log(`Consuming (finishing) transaction ${transaction.transactionId}...`);
    transaction.finish();
}
```

***

**Build and Test (Android/Google Play Consumable)**

Follow the testing procedure outlined for non-consumables on Android, keeping consumables in mind:

1. **Create Release Build:** Use your release keystore.
2. **Upload to Play Console:** Upload the signed APK/AAB to an internal or closed testing track. Add testers. Roll out.
3. **Prepare Test Device:** Use a physical device logged in _only_ with a tester Google account. Install the app _from the Play Store_ using the test link/invitation.
4. **Run & Monitor:** Launch the app and monitor logs with `adb logcat CordovaPurchase:V CordovaLog:V chromium:D *:S`.
5. **Test Purchase:**
   * Verify initial UI (coin count, product details, buy button).
   * Tap "Buy Coins".
   * Confirm purchase in the Google Play dialog ("Test card, always approves").
   * Observe logs: `approved`, `verified` (if validator set), `Granting consumable...`, `Consuming (finishing) transaction...`, `finished`.
   * Verify the coin count increases correctly.
   * The "Buy Coins" button should remain available, allowing repurchase.

***

This completes the consumable purchase flow for Android/Google Play. The key step is using `transaction.finish()`, which implicitly consumes the product on this platform for this product type, making it available for purchase again.

## 4. Receipt Validation (Recommended)

Validating receipts server-side prevents fraud and ensures purchases are legitimate before granting items, even for consumables.

{% hint style="info" %}
**Receipt Validation Reminder**

Remember, for subscriptions and non-consumables, relying solely on local device data is insecure and unreliable for managing entitlements.

**Always implement server-side receipt validation** using your own backend or a service like [Iaptic](https://www.iaptic.com/) to:

* Confirm purchase legitimacy.
* Get the authoritative subscription status and expiry date.
* Prevent fraud.
* Support cross-platform/device access.

Ensure `store.validator` is configured in your `initStore()` function.
{% endhint %}

\## 5. Testing

Follow the specific testing procedures for Google Play (signed release build, testing tracks, license tester accounts) outlined in the platform-specific purchase flow section above.
