# Non-Consumable on AppStore

This use case explains how to implement a non-consumable product (like unlocking a premium feature or removing ads) on iOS using the App Store.

!INCLUDE "../sections/setup-appstore.md"

## Initialization

We use the generic initialization structure and provide the specific implementations for rendering the UI and granting the entitlement for our non-consumable feature.

!INCLUDE "../sections/non-consumable-generic-initialization.md"

```javascript
// --- Specific Implementations for Non-Consumable Feature Unlock ---

// This function updates the UI based on feature ownership
function renderUI() {
    const messagesEl = document.getElementById('messages');
    if (!messagesEl) return;

    // Check ownership using store.owned()
    const isFeatureUnlocked = CdvPurchase.store.owned('unlock_feature_x'); // Use your actual Product ID

    // Update messages or unlock UI elements
    messagesEl.textContent = 'Premium Feature: ' + (isFeatureUnlocked ? 'Unlocked!' : 'Locked');

    // Optionally update the product display (disable button if owned)
    const product = CdvPurchase.store.get('unlock_feature_x');
    if (product) renderProduct(product); // Assumes renderProduct is defined in the included section
}

// Function to grant access to the purchased feature
function grantEntitlement(productId) {
    if (productId === 'unlock_feature_x') { // Use your actual Product ID
        log('Granting entitlement for non-consumable feature: ' + productId);

        // ** IMPORTANT: Persist this state securely! **
        // localStorage is NOT secure for entitlements. Use SecureStorage plugin or sync with a backend.
        // For this example, we'll use localStorage for simplicity.
        try {
            window.localStorage.setItem(productId + '_owned', 'true');
            log('Ownership flag set in localStorage.');
        } catch (e) {
            log('Error saving ownership to localStorage: ' + e);
        }

        renderUI(); // Update the UI immediately to reflect the unlocked state
    }
}

// --- Ensure required functions are available ---
// These might be included from the generic section, verify they exist.

// function renderProduct(product) { ... }
// function requestPurchase(platform, productId, offerId) { ... }
// function updateMessages(text) { ... }
// function log(msg) { ... }

// --- Final Setup ---

// Re-render UI on device ready based on stored entitlement
document.addEventListener('deviceready', () => {
    // In a real app, check secure storage here before the initial render
    const storedOwned = window.localStorage.getItem('unlock_feature_x_owned') === 'true';
    if (storedOwned) {
         log('Feature was already owned according to localStorage.');
    }
    renderUI();
}, false);
```

## Purchase Flow

The core purchase flow logic (handling `approved`, `verified`, `finished`) is established in the included generic initialization section. The essential parts specific to this use case are the `renderUI` and `grantEntitlement` functions defined above, which handle unlocking the feature and securely persisting the ownership state.

!INCLUDE "../sections/receipt-validation-reminder.md"

## iOS Specific Notes

!INCLUDE "../sections/non-consumable-ios.md"
