## Code Implementation

This section describes the minimal code required to implement a non-consumable product (e.g., remove ads, unlock premium features) on Android using the Google Play platform.

### Base framework

First, we set up the basic HTML structure and the initial JavaScript to load the plugin. If you haven't already, check [Setup Code Framework](/setup/code-framework).

### Initialization & Presentation

Next, we initialize the plugin, register our non-consumable product, and set up the UI. This involves:
*   Registering the product with type `NON_CONSUMABLE`.
*   Displaying product details (title, description, price).
*   Showing a "Buy" or "Unlock" button only when the product `canPurchase`.
*   Checking the `product.owned` status to reflect whether the feature is unlocked in the UI.

!INCLUDE "./non-consumable-generic-initialization.src.md"

### Purchase Flow

Finally, we handle the purchase events. For non-consumables on Google Play, the key is to **acknowledge** the purchase to prevent automatic refunds.
*   Initiate the order when the "Buy/Unlock" button is clicked.
*   Handle the `approved` state. Verification is optional but highly recommended to prevent fraud.
*   **Acknowledge** the purchase by calling `transaction.finish()`. This confirms delivery to Google Play. **Do not consume** non-consumable products.
*   Update your application state (e.g., set `window.localStorage.featureUnlocked = "YES"`) and refresh the UI.

!INCLUDE "./non-consumable-android.src.md"