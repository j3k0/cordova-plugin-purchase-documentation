This section covers the initial setup and UI display for a **consumable** product (like virtual currency or game lives) using the `cordova-plugin-purchase` plugin (v13+). It focuses on registering the product and displaying its information, deferring the actual purchase logic to platform-specific guides.

**Assumptions:**

*   You have completed the basic [Framework setup](./code-framework.md).
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
