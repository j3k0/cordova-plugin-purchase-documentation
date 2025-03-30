# Consumable on Google Play

This use case explains how to implement a consumable product (like virtual currency or extra lives) on Android using Google Play.

!INCLUDE "../sections/setup-googleplay.md"

## Initialization

We use the generic initialization structure and provide specific implementations for rendering the UI and granting the consumable item (e.g., coins).

!INCLUDE "../sections/consumable-generic-initialization.md"

```javascript
// --- Specific Implementations for Consumable Coins ---

// Example: Store balance in localStorage (INSECURE - use SecureStorage or backend!)
let userCoinBalance = 0;
const COIN_BALANCE_KEY = 'userCoinBalance';
const COINS_PER_PURCHASE = 100; // Amount granted by MY_CONSUMABLE_ID

function loadBalance() {
    try {
        userCoinBalance = parseInt(window.localStorage.getItem(COIN_BALANCE_KEY) || '0');
    } catch (e) {
        log('Error loading balance: ' + e);
        userCoinBalance = 0;
    }
}
function saveBalance() {
    try {
        window.localStorage.setItem(COIN_BALANCE_KEY, userCoinBalance.toString());
    } catch (e) {
        log('Error saving balance: ' + e);
    }
}

// This function updates the UI based on the coin balance
function renderUI() {
    const messagesEl = document.getElementById('messages');
    if (messagesEl) messagesEl.textContent = 'Store ready.'; // Clear status message

    const balanceEl = document.getElementById('balance');
    if (balanceEl) {
        balanceEl.textContent = 'Coins: ' + userCoinBalance;
    }

    // Re-render product display
    const product = CdvPurchase.store.get('consumable1_gp'); // Use your actual Google Play Product ID
    if (product) renderProduct(product);
}

// Function to grant the consumable item (coins)
function grantCoins(amount) {
    log(`Granting ${amount} coins.`);
    userCoinBalance += amount;
    saveBalance(); // Persist the new balance
    renderUI(); // Update the displayed balance
}

// function renderProduct(product) { ... }
// function requestPurchase(platform, productId, offerId) { ... }
// function updateMessages(text) { ... }
// function log(msg) { ... }

// --- Final Setup ---

// Re-register product with correct platform
function initStore() {
    const { store, ProductType, Platform } = CdvPurchase;
    // ... other init steps from included file, excluding the generic registration...

    store.register({
        id: 'consumable1_gp', // Use your actual Google Play Product ID
        type: ProductType.CONSUMABLE,
        platform: Platform.GOOGLE_PLAY
    });

    // *** Setup Validator (Recommended) ***
    // store.validator = "YOUR_VALIDATOR_URL";

    // ... rest of initStore from included file (event listeners, initialize call) ...
}

// Load initial balance and render UI on device ready
document.addEventListener('deviceready', () => {
    loadBalance();
    renderUI();
}, false);
```

## Purchase Flow

The core purchase flow logic (`approved`, `verified`, `finished`) is in the included generic section. For Google Play consumables:

1.  **Granting the Item:** The `grantCoins` function (called after `approved` without validation, or after `verified` with validation) adds the coins to the user's balance and saves it.
2.  **Finishing/Consuming:** The `transaction.finish()` or `receipt.finish()` call consumes the purchase on Google Play via the Billing Library's `consumeAsync`, allowing it to be purchased again.

!INCLUDE "../sections/receipt-validation-reminder.md"
*(Note: Validation adds a layer of security against replay attacks or fraudulent claims, even for consumables, especially if the balance is important or synced server-side).*

## Android Specific Notes

!INCLUDE "../sections/consumable-android.md"
