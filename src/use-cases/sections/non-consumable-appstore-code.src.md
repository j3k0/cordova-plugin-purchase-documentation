## Code Implementation

This section details the minimal code required to implement a non-consumable product (like unlocking a feature or removing ads) on iOS and macOS using the AppStore platform.

### Base framework

First, let's set up the basic HTML structure and the initial JavaScript to load the plugin, make sure you have performed the basic [Code Framework Setup](/setup/code-framework).

### Initialization & Presentation

Now, we'll initialize the plugin, register our non-consumable product, and set up the UI to display its status and purchase options. This involves:
*   Registering the product with type `NON_CONSUMABLE`.
*   Displaying product details (title, description, price).
*   Showing a "Buy" or "Unlock" button only when the product `canPurchase`.
*   Reflecting the unlocked status in the UI (e.g., showing the premium feature or hiding ads).

!INCLUDE "./non-consumable-generic-initialization.src.md"

### Purchase Flow

Finally, we need to handle the purchase events triggered when the user buys the non-consumable product. This typically involves:
*   Initiating the order when the "Buy/Unlock" button is clicked.
*   Verifying the transaction with the receipt validator upon approval (optional but recommended).
*   Finishing the transaction once approved (or verified) to grant access permanently.
*   Updating the UI to reflect the unlocked status.

!INCLUDE "./non-consumable-ios.src.md"