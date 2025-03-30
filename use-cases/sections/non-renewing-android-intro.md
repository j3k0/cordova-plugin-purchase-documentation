# Non-Renewing Subscription on Android

This guide demonstrates how to implement a **non-renewing subscription** product using the Google Play platform for Android applications.

On Google Play, non-renewing subscriptions are technically treated as **one-time products** (similar to consumables or non-consumables) that grant entitlement for a fixed duration. Unlike auto-renewing subscriptions, Google Play **does not automatically manage renewals or cancellations** for these products.

Key characteristics on Google Play:

*   Purchased as a one-time product via the standard purchase flow.
*   Your application is responsible for determining the access duration based on the product purchased (e.g., a product with ID `1_month_access` grants 1 month of entitlement).
*   Your application must calculate and track the expiry date based on the purchase time. Using a receipt validator is recommended to get an accurate purchase time.
*   Purchases **must be acknowledged** within 3 days using `transaction.finish()` to prevent automatic refunds by Google.
*   They **should not be consumed**, as consuming them would remove the entitlement record from Google's perspective (though your app manages the actual expiry).
*   Users can typically purchase the product again (e.g., buy another month) once access expires, or potentially before expiry to extend access, depending on your app's logic for calculating the new expiry date.

In this guide, we will build a simple application that allows users to purchase a non-renewing subscription granting access for a specific period, managing the expiry date within the app.
