# Consumable on AppStore

This use case explains how to implement a consumable product (like virtual currency or extra lives) on iOS using the App Store.

!INCLUDE "../sections/setup-appstore.md"

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
    const product = CdvPurchase.store.get('consumable1'); // Use your actual Product ID
    if (product) renderProduct(product);
}

// Function to grant the consumable item (coins)
function grantCoins(amount) {
    log(`Granting ${amount} coins.`);
    userCoinBalance += amount;
    saveBalance(); // Persist the new balance
    renderUI(); // Update the displayed balance
}

// --- Ensure required functions are available ---
// These should be defined in the included generic section or here.

// function renderProduct(product) { ... } // Included
// function requestPurchase(platform, productId, offerId) { ... } // Included
// function updateMessages(text) { ... } // Included
// function log(msg) { ... } // Included

// --- Final Setup ---

// Load initial balance and render UI on device ready
document.addEventListener('deviceready', () => {
    loadBalance();
    renderUI();
}, false);
```

## Purchase Flow

The core purchase flow logic (`approved`, `verified`, `finished`) is in the included generic section. The key parts for consumables are:

1.  **Granting the Item:** The `grantCoins` function (called after `approved` without validation, or after `verified` with validation) adds the coins to the user's balance and saves it.
2.  **Finishing/Consuming:** The `transaction.finish()` or `receipt.finish()` call marks the purchase as consumed on the platform, allowing it to be purchased again.

!INCLUDE "../sections/receipt-validation-reminder.md"
*(Note: While less critical than for subscriptions, validating consumables prevents basic fraud where users might modify local data to trigger the `approved` event repeatedly without paying).*

## iOS Specific Notes

!INCLUDE "../sections/consumable-ios.md"