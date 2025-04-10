# Consumable on AppStore (iOS & macOS)

This use case explains how to implement a **consumable** product (like virtual currency or extra lives) on iOS and macOS using the App Store platform and `cordova-plugin-purchase` v13+.

## 1. Platform Setup

First, ensure your Apple Developer account, App Store Connect, and Xcode project are correctly configured for In-App Purchases.

⇒ [Setup instructions here](../setup/setup-appstore.md).

## 2. Initialization & UI

Next, set up the basic JavaScript to initialize the plugin, register your consumable product, and display its information and the user's balance.


This section covers the initial setup and UI display for a **consumable** product (like virtual currency or game lives) using the `cordova-plugin-purchase` plugin (v13+). It focuses on registering the product and displaying its information, deferring the actual purchase logic to platform-specific guides.

**Assumptions:**

*   You have completed the basic [Code Framework Setup](../setup/code-framework.md).
*   You have created a consumable product in your target platform's developer console (App Store Connect or Google Play Console).

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

1.  **Product Definition (Line 9):** Define the `id` of your consumable product exactly as it appears in App Store Connect or Google Play Console.
2.  **Register Product (Lines 13-17):** Call `store.register()` with the `id`, `type` set to `ProductType.CONSUMABLE`, and the correct `platform`.
3.  **Validator Setup (Lines 20-24):** Optionally configure `store.validator` with your validation service URL. While not strictly mandatory for basic consumable functionality, it's recommended for security.
4.  **Event Listeners (Lines 27-38):** Set up a listener for `productUpdated`. This event fires when the product's details (title, price, etc.) are loaded from the store. Inside the callback, we call `refreshUI()` to display this information. Purchase-related listeners (`approved`, `verified`, `finished`) will be added later.
5.  **Initialize Store (Lines 41-50):** Call `store.initialize()` with the platform(s) you registered products for. This starts the connection to the store and begins loading product data.
6.  **UI Rendering (Lines 54-100):**
    *   The `refreshUI` function is responsible for displaying the product information and the user's current balance (e.g., number of coins).
    *   It uses `store.get(MY_CONSUMABLE_ID)` to retrieve the loaded product data.
    *   It displays the title, description, and price from the product's default `Offer`.
    *   It shows a "Buy" button if `offer.canPurchase` is true. The `onclick` calls `buyConsumable()`, which will be implemented next.
    *   It displays the user's coin balance (using `localStorage` here for simplicity – **use secure storage or a server backend in production**).
7.  **Placeholders (Lines 103-113):** Empty functions `buyConsumable` and `grantCoins` are defined. Their specific implementation depends on the platform and will be covered in the next steps.
8.  **Initial Load (Lines 116-126):** Ensures the initialization runs and the initial UI (including balance) is rendered when the device is ready.

This setup prepares your app to display the consumable product. The next steps involve implementing the platform-specific purchase flow (Android or iOS) to handle the actual buying process and granting the item.


*   **Note:** Replace the placeholder product ID (`'consumable1'`) in the code with your actual App Store Product ID. Adapt the `grantCoins` function and UI rendering (`refreshUI`) to match your specific consumable item (e.g., lives, credits). Remember to use secure storage instead of `localStorage` for balances in production.

## 3. Purchase Flow

Implement the logic to handle the purchase process when the user taps the "Buy" button. This involves initiating the order and handling the `approved`, `verified` (optional but recommended), and `finished` events to grant the item and consume the purchase.


### Purchase Flow (iOS/App Store Consumable)

This section details how to handle the purchase of a consumable item (like virtual currency or extra lives) on iOS/App Store. The process is very similar to Android, with `transaction.finish()` also serving to consume the item.

**Step 1: Implement the Purchase Action (`buyConsumable`)**

*   **What:** Replace the placeholder `window.buyConsumable` function to call `offer.order()` for the App Store platform.
*   **Why:** This triggers the App Store purchase process when the user clicks the "Buy Coins" button.

Replace the placeholder `window.buyConsumable` function in `www/js/index.js`:

```javascript
// In js/index.js

// Make this function globally accessible for the button's onclick
window.buyConsumable = function() {
    const productId = 'consumable1'; // Use the SAME product ID you registered
    console.log(`Purchase button clicked for consumable: ${productId}`);
    const { store, Platform } = CdvPurchase;

    const product = store.get(productId, Platform.APPLE_APPSTORE); // Get AppStore product
    const offer = product?.getOffer(); // Get the default offer

    if (offer) {
        console.log(`Initiating order for consumable offer: ${offer.id}`);
        setStatus('Initiating purchase...');

        offer.order()
            .then(result => {
                // Promise resolves when the App Store sheet is dismissed.
                // Outcome handled by listeners.
                if (result && result.isError) {
                    setStatus(`Order failed: ${result.message}`);
                } else {
                    // Purchase flow started... status updated by listeners.
                }
                refreshUI();
            })
            .catch(err => {
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

*   **What:** Add the purchase lifecycle event listeners within the `store.when()` chain in your `initializeStoreAndSetupListeners` function (created during generic initialization).
*   **Why:** These listeners handle the progression of the purchase: approval by App Store, optional verification, and finalization (consumption).

Add these handlers inside the existing `store.when()` call:

```javascript
// Inside initializeStoreAndSetupListeners() -> store.when() chain

    .approved(transaction => {
        console.log(`Transaction ${transaction.transactionId} approved for ${transaction.products[0]?.id}.`);
        setStatus('Purchase approved. Verifying...');

        // Verification is recommended.
        if (store.validator) {
            transaction.verify();
        } else {
             console.warn("Receipt validator not configured. Granting consumable without server verification.");
             // Grant the item and finish directly if no validator.
             grantConsumableAndFinish(transaction);
        }
    })
    .verified(receipt => {
        console.log(`Receipt verified for transaction ${receipt.transactions[0]?.transactionId}`);
        setStatus('Purchase verified. Finishing...');

        // Find the relevant transaction
        const verifiedTransaction = receipt.transactions
            .find(t => t.products[0]?.id === MY_CONSUMABLE_ID); // Use your consumable product ID

        if (verifiedTransaction) {
            // Grant the item and finish the transaction
            grantConsumableAndFinish(verifiedTransaction);
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
        refreshUI(); // Refresh the coin display & product UI
    })
    .cancelled(transaction => {
        console.log('Purchase Cancelled:', transaction.transactionId);
        setStatus('Purchase cancelled.');
        refreshUI();
    });
    // Ensure the .productUpdated listener from the generic setup is still present
```

**Step 3: Implement Granting and Finishing Logic (`grantConsumableAndFinish`)**

*   **What:** Replace the placeholder `grantConsumableAndFinish` function. This function updates the user's balance (e.g., adds gold coins in `localStorage`) and then calls `transaction.finish()`.
*   **Why:** This encapsulates the delivery of the virtual item. Calling `transaction.finish()` on iOS for a consumable effectively **consumes** it, removing it from the transaction queue and allowing it to be purchased again.

Replace the placeholder `grantConsumableAndFinish` function in `www/js/index.js`:

```javascript
// In js/index.js

// Replace the placeholder function
function grantConsumableAndFinish(transaction) {
    console.log(`Granting consumable for transaction ${transaction.transactionId}...`);

    // Determine the quantity (always 1 for App Store consumables)
    const quantity = 1;
    const coinsToAdd = COINS_GRANTED * quantity; // Use constant defined earlier

    // Add the item(s) to the user's inventory/balance
    const currentCoins = parseInt(window.localStorage.getItem(COIN_BALANCE_KEY) || '0', 10);
    window.localStorage.setItem(COIN_BALANCE_KEY, (currentCoins + coinsToAdd).toString());

    console.log(`Added ${coinsToAdd} coins. New balance: ${currentCoins + coinsToAdd}`);

    // Refresh the UI immediately (optional, .finished listener also calls refreshUI)
    // refreshUI();

    // Finish (consume) the transaction with the App Store.
    console.log(`Finishing transaction ${transaction.transactionId}...`);
    transaction.finish();
}
```

---

**Build and Test (iOS/App Store Consumable)**

Follow the testing procedure outlined for non-consumables on iOS:

1.  **Prepare:** `cordova prepare ios`
2.  **Open:** `open platforms/ios/*.xcodeproj` (or `.xcworkspace`)
3.  **Configure Xcode:** Set signing, select physical test device.
4.  **Prepare Sandbox Tester:** Sign out of App Store on device, have Sandbox Tester credentials ready.
5.  **Run:** Build and run from Xcode (▶).
6.  **Test:**
    *   Verify initial UI shows product details and "Buy Coins" button.
    *   Tap "Buy Coins".
    *   Sign in with Sandbox Tester when prompted.
    *   Confirm purchase.
    *   Observe logs for `approved`, `verified` (if validator set), `Granting consumable...`, `Finishing transaction...`, `finished` messages.
    *   Verify the gold coin count increases in the UI.
    *   The "Buy Coins" button should remain available, allowing repurchase.

---

This completes the purchase flow for iOS/App Store consumables. The key is calling `transaction.finish()` after successfully granting the item to the user, which consumes the purchase on this platform.


## 4. Receipt Validation (Recommended)

While not strictly mandatory for basic consumable functionality on iOS (unlike subscriptions), validating receipts server-side prevents fraud and ensures purchases are legitimate before granting items.


{% hint style="info" icon="info" %}
**Receipt Validation Reminder**

Remember, for subscriptions and non-consumables, relying solely on local device data is insecure and unreliable for managing entitlements.

**Always implement server-side receipt validation** using your own backend or a service like [Iaptic](https://www.iaptic.com/) to:
*   Confirm purchase legitimacy.
*   Get the authoritative subscription status and expiry date.
*   Prevent fraud.
*   Support cross-platform/device access.

Ensure `store.validator` is configured in your `initStore()` function.
{% endhint %}

## 5. Testing

Follow the specific testing procedures for iOS/macOS Sandbox environments outlined in the platform-specific purchase flow section above.
