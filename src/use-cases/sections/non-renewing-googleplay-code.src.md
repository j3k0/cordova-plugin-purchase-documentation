## Code Implementation

This section describes the minimal code required to implement a non-renewing subscription product (granting access for a fixed period, like 1 month or 1 year) on Android using the Google Play platform.

### Base framework

First, let's set up the basic HTML structure and the initial JavaScript to load the plugin, make sure you have performed the basic [Code Framework Setup](../setup/code-framework.md).

### Initialization & Presentation

Now, we'll initialize the plugin, register our non-renewing subscription product, and set up the UI to display its status and purchase options. This involves:
*   Registering the product with type `NON_RENEWING_SUBSCRIPTION`.
*   Displaying product details (title, description, price, duration).
*   Displaying the current access expiry date if the subscription is active.
*   Showing a "Subscribe" or "Extend" button. Google Play treats these similarly to consumables, so they can typically be purchased again once expired (or potentially even before to extend).


!INCLUDE "./subscription-generic-initialization.src.md"


### Purchase Flow

Handling the purchase flow for non-renewing subscriptions on Google Play is similar to consumables or non-consumables in that they need to be **acknowledged**. They grant access for a fixed duration defined by the product.
*   Initiate the order when the "Subscribe/Extend" button is clicked.
*   Handle the `approved` state. Verification is optional but recommended.
*   **Acknowledge** the purchase by calling `transaction.finish()`. This prevents Google Play from automatically refunding after 3 days. **Do not consume** non-renewing subscriptions.
*   Your application logic should track the expiry date based on the purchase time and product duration to manage access.


!INCLUDE "./non-renewing-android-purchase.src.md"

