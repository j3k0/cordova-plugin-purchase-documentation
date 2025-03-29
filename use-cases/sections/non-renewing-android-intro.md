# Non-Renewing Subscription on Android

This guide demonstrates how to implement a **non-renewing subscription** product using the Google Play platform for Android applications.

On Google Play, non-renewing subscriptions are technically treated as **one-time products** (similar to consumables or non-consumables) that grant entitlement for a fixed duration. Unlike auto-renewing subscriptions, Google Play **does not automatically manage renewals or cancellations** for these products.

Key characteristics on Google Play:

*   Purchased as a one-time product.
*   Your application is responsible for determining the access duration based on the product purchased (e.g., a "1 Month Access" product grants 1 month of entitlement).
*   Your application must track the expiry date based on the purchase time.
*   Purchases must be **acknowledged** within 3 days using `transaction.finish()` to prevent automatic refunds by Google.
*   They **should not be consumed**, as consuming them would remove the entitlement.
*   Users can typically purchase the product again (e.g., buy another month) once access expires, or potentially before expiry to extend access, depending on your app's logic.

In this guide, we will build a simple application that allows users to purchase a non-renewing subscription granting access for a specific period.