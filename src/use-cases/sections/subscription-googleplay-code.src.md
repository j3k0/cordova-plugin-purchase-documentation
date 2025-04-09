## Code Implementation

This section describes the minimal code required to implement an auto-renewing subscription product on Android using the Google Play platform.

### Base framework

First, let's set up the basic HTML structure and the initial JavaScript to load the plugin, make sure you have performed the basic [Code Framework Setup](/setup/code-framework).

### Initialization & Presentation

Now, we'll initialize the plugin, register our subscription products, and set up the UI to display their status and purchase options. This involves:
*   Registering products with type `PAID_SUBSCRIPTION`.
*   Setting up a receipt validator connected to the Google Play Developer API (required for reliable subscription handling on Android - see Step 9 in the setup).
*   Displaying product details (title, description, price, billing period, trial info).
*   Displaying the current subscription status (subscribed, expired, in grace period) based on verified receipt data.
*   Showing a "Subscribe" button only when the product `canPurchase`.

!INCLUDE "./subscription-generic-initialization.src.md"

*Note: The reliability of fields like `expiryDate` and `owned` status heavily depends on using a receipt validator connected to the Google Play Developer API.*

### Purchase Flow

Finally, we handle the purchase events for subscriptions. This requires verification and acknowledging the purchase.
*   Initiate the order when the "Subscribe" button is clicked. Consider handling upgrades/downgrades using `additionalData` if products are in the same `group` or by specifying `oldPurchaseToken`.
*   Verify the transaction with the receipt validator upon approval using `transaction.verify()`.
*   Acknowledge the purchase by calling `receipt.finish()` (or `transaction.finish()`) once verified. This is crucial to prevent automatic refunds and ensures proper subscription state management by Google Play.

!INCLUDE "./subscription-android.src.md"