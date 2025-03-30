# Non-Renewing Subscription on iOS & macOS

This guide demonstrates how to implement a **non-renewing subscription** product using the AppStore platform for iOS and macOS applications.

Non-renewing subscriptions grant access to content or services for a **fixed, limited duration** (e.g., 1 month, 6 months, 1 year). Unlike auto-renewing subscriptions, they **do not automatically renew** at the end of the period. The user must explicitly purchase the subscription again to extend access.

Key characteristics on Apple platforms:

*   Purchased as a one-time transaction via StoreKit.
*   Entitlement management (tracking expiry) is **entirely handled by your application logic** after the initial purchase. Apple does not track the expiry or renewal status for these.
*   Often used for time-limited access to content archives, seasonal passes, or services where auto-renewal isn't desired or appropriate.
*   Requires careful handling of expiry dates based on the purchase time and product duration.
*   Requires **acknowledging** the purchase using `transaction.finish()` to remove it from the payment queue.
*   Requires syncing purchase status and expiry across devices if you support user accounts (typically via your own backend).

In this guide, we will build a simple application that allows users to purchase a non-renewing subscription which grants access for a defined period, managing the expiry date within the app.
