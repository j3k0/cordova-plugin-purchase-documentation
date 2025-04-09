# About IAP Technology

This page provides a brief overview of the core concepts behind In-App Purchase (IAP) technology, which are common across platforms like Apple App Store and Google Play. Understanding these helps in effectively using the `cordova-plugin-purchase` plugin.

## Virtual Products

Platforms allow you to sell digital goods and services directly within your application. These are typically categorized into several types, each requiring slightly different handling within your app and the plugin:

*   **Consumable Products:**
    *   **Concept:** Items that are used up and can be purchased multiple times (e.g., virtual currency like coins or gems, extra lives, temporary power-ups).
    *   **Management:** Your application is responsible for tracking the user's balance or inventory of these items after purchase.
    *   **Plugin Handling:** Requires **consuming** the purchase after delivery by calling `transaction.finish()` or `receipt.finish()`. This signals to the platform that the item has been granted and allows the user to purchase it again.
    *   **Plugin Type:** `CdvPurchase.ProductType.CONSUMABLE`

*   **Non-Consumable Products:**
    *   **Concept:** Items purchased once and permanently owned by the user (e.g., unlocking a premium feature, removing ads, downloading a specific piece of content like a level pack or map).
    *   **Management:** The platform typically tracks ownership, allowing restoration on other devices linked to the same user account (via `store.restorePurchases()`).
    *   **Plugin Handling:** Requires **acknowledging** the purchase by calling `transaction.finish()` or `receipt.finish()`. This finalizes the transaction on the platform but does *not* consume it, ensuring permanent ownership.
    *   **Plugin Type:** `CdvPurchase.ProductType.NON_CONSUMABLE`

*   **Auto-Renewing Subscriptions:**
    *   **Concept:** Provide access to content or services for a specific period (e.g., weekly, monthly, yearly). They automatically renew and charge the user at the end of each period unless explicitly cancelled.
    *   **Management:** Managed largely by the platform (renewals, cancellations, billing issues, expiry dates). However, **server-side receipt validation is essential** for reliably tracking the *current* status (active, expired, grace period, renewal intent).
    *   **Plugin Handling:** Requires **acknowledging** the purchase after validation by calling `transaction.finish()` or `receipt.finish()`.
    *   **Plugin Type:** `CdvPurchase.ProductType.PAID_SUBSCRIPTION`

*   **Non-Renewing Subscriptions:**
    *   **Concept:** Provide access for a fixed, limited duration (e.g., 1-month pass, seasonal content access). They do **not** automatically renew. The user must explicitly purchase again to extend access.
    *   **Management:** Your application is responsible for managing the entitlement period based on the purchase date and the product's defined duration. Server-side validation can provide a more reliable purchase date.
    *   **Plugin Handling:** Requires **acknowledging** the purchase on the platform by calling `transaction.finish()` or `receipt.finish()`.
    *   **Plugin Type:** `CdvPurchase.ProductType.NON_RENEWING_SUBSCRIPTION`

The `cordova-plugin-purchase` plugin uses these distinct `ProductType` enums to help manage the specific behaviors required for each category across different platforms.

## User Accounts & Ownership

*   **Platform Account:** Purchases are fundamentally linked to the user's platform account (Apple ID for App Store, Google Account for Google Play).
*   **Cross-Device Access:** Non-consumables and active subscriptions associated with a platform account are generally accessible across all devices logged into that same account. The `store.restorePurchases()` method helps retrieve this information and re-sync the local device state.
*   **Application Username:** For apps with their own user login systems (independent of the platform account), it's crucial to link platform purchases to your internal user accounts. This is typically done during receipt validation on your server. You can provide an identifier using the `store.applicationUsername` property, which the plugin can include in validation requests. This allows users to access their purchases even if they switch platform accounts or devices, as long as they log into *your* app with *their* specific application account.

## Testing Environment

*   **Sandbox/Test Accounts:** Both Apple and Google provide testing environments (Sandbox for Apple, License Testing for Google) that allow developers to test the entire purchase flow using special test accounts without incurring real charges.
*   **Dedicated Accounts:** You **must** create specific test accounts (Sandbox Apple ID, Google License Tester Account) for this purpose. Using real accounts for testing can lead to unexpected charges or issues.
*   **Environment Differences:** Be aware that test environments might have slightly different behaviors (e.g., accelerated subscription renewals, specific test card responses, different UI prompts). Always test thoroughly in the production environment before launch (e.g., using promo codes or with trusted users if possible).

Understanding these general principles is key to successfully implementing IAPs using the `cordova-plugin-purchase` plugin.
