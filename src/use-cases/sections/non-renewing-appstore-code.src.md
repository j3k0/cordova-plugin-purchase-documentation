## Code Implementation

This section describes the minimal code required to implement a non-renewing subscription product (granting access for a fixed period) on iOS and macOS using the AppStore platform.

### Base framework

First, let's set up the basic HTML structure and the initial JavaScript to load the plugin. Make sure you have performed the basic [Code Framework Setup](../setup/code-framework.md).

### Initialization & Presentation

Now, we'll initialize the plugin, register our non-renewing subscription product, and set up the UI to display its status and purchase options. This involves:
*   Registering the product with type `NON_RENEWING_SUBSCRIPTION`.
*   Displaying product details (title, description, price, duration).
*   Displaying the current access expiry date if the subscription is active. *Your application needs to calculate and store this based on purchase history.*
*   Showing a "Subscribe" or "Extend" button. Non-renewing subscriptions can typically be purchased multiple times to extend access.


!INCLUDE "./subscription-generic-initialization.src.md"


### Purchase Flow

Handling the purchase flow for non-renewing subscriptions on Apple platforms involves purchasing the product and then managing the entitlement period within your application.
*   Initiate the order when the "Subscribe/Extend" button is clicked.
*   Handle the `approved` state. Verification is optional but recommended for tracking purchase history reliably.
*   Call `transaction.finish()` once the purchase is approved (or verified).
*   Your application must record the purchase time and calculate the expiry date based on the product's defined duration (e.g., 1 month, 1 year).
*   Store this expiry date persistently (e.g., `localStorage`, secure storage, or synced with your backend).
*   Implement logic to check the expiry date to grant or deny access to the content/service.
*   If you support user accounts, you need to sync this entitlement across the user's devices.


!INCLUDE "./non-renewing-ios-purchase.src.md"

