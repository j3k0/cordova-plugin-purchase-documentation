## Code Implementation

This section details the minimal code required to implement a subscription product on iOS and macOS using the AppStore platform.

### Base framework

First, let's set up the basic HTML structure and the initial JavaScript to load the plugin.

!INCLUDE "./code-framework.md"

### Initialization & Presentation

Now, we'll initialize the plugin, register our subscription products, and set up the UI to display their status and purchase options. This involves:
*   Registering products with type `PAID_SUBSCRIPTION`.
*   Setting up a receipt validator (required for reliable subscription handling).
*   Displaying product details (title, description, price, expiry).
*   Showing a "Subscribe" button only when the product `canPurchase`.

!INCLUDE "./subscription-generic-initialization.md"

### Purchase Flow

Finally, we need to handle the purchase events triggered when the user initiates a subscription purchase. This typically involves:
*   Initiating the order when the "Subscribe" button is clicked.
*   Verifying the transaction with the receipt validator upon approval.
*   Finishing the transaction once verified to grant access.

!INCLUDE "./subscription-ios.md"