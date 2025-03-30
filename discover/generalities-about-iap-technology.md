# About IAP Technology

This page provides a brief overview of the core concepts behind In-App Purchase (IAP) technology, which are common across platforms like Apple App Store and Google Play. Understanding these helps in effectively using the `cordova-plugin-purchase`.

## Virtual Products

Platforms allow you to sell digital goods and services directly within your application. These are typically categorized into several types:

*   **Consumable Products:**
    *   Items that are used up and can be purchased multiple times (e.g., virtual currency like coins or gems, extra lives, temporary power-ups).
    *   The application is responsible for tracking the user's balance or inventory of these items.
    *   Requires **consuming** the purchase on the platform (via `transaction.finish()` for consumables) to allow repurchase.
    *   *Plugin Type:* `CdvPurchase.ProductType.CONSUMABLE`

*   **Non-Consumable Products:**
    *   Items purchased once and permanently owned by the user (e.g., unlocking a premium feature, removing ads, downloading a specific piece of content like a level pack).
    *   The platform typically tracks ownership, allowing restoration on other devices linked to the same user account.
    *   Requires **acknowledging** the purchase (via `transaction.finish()` for non-consumables) to finalize it.
    *   *Plugin Type:* `CdvPurchase.ProductType.NON_CONSUMABLE`

*   **Auto-Renewing Subscriptions:**
    *   Provide access to content or services for a specific period (e.g., weekly, monthly, yearly).
    *   Automatically renew and charge the user at the end of each period unless explicitly cancelled by the user.
    *   Managed largely by the platform (renewals, cancellations, billing issues).
    *   **Requires server-side receipt validation** for reliable status tracking (expiry, renewal intent, grace periods).
    *   *Plugin Type:* `CdvPurchase.ProductType.PAID_SUBSCRIPTION`

*   **Non-Renewing Subscriptions:**
    *   Provide access for a fixed, limited duration (e.g., 1-month pass, seasonal content access).
    *   Do **not** automatically renew. The user must purchase again to extend access.
    *   The application is responsible for managing the entitlement period based on the purchase date and the product's defined duration.
    *   Requires **acknowledging** the purchase on the platform (via `transaction.finish()`).
    *   *Plugin Type:* `CdvPurchase.ProductType.NON_RENEWING_SUBSCRIPTION`

The `cordova-plugin-purchase` provides these distinct `ProductType` enums to handle the nuances of each category across different platforms.

## User Accounts & Ownership

*   **Platform Account:** Purchases are fundamentally linked to the user's platform account (Apple ID for App Store, Google Account for Google Play).
*   **Cross-Device Access:** Non-consumables and active subscriptions associated with a platform account are generally accessible across all devices logged into that same account. The `store.restorePurchases()` method helps retrieve this information.
*   **Application Username:** For apps with their own user login systems, it's crucial to link platform purchases to your internal user accounts. This is typically done during receipt validation on your server using the `store.applicationUsername` property. This allows users to access their purchases even if they switch platform accounts or devices but log into *your* app with *their* account.

## Testing Environment

*   **Sandbox/Test Accounts:** Both Apple and Google provide testing environments (Sandbox for Apple, License Testing for Google) that allow developers to test the entire purchase flow without incurring real charges.
*   **Dedicated Accounts:** You **must** create specific test accounts (Sandbox Apple ID, Google License Tester Account) for this purpose. Using real accounts for testing can lead to unexpected charges or issues.
*   **Environment Differences:** Be aware that test environments might have slightly different behaviors (e.g., accelerated subscription renewals, specific test card responses).

Understanding these general principles is key to successfully implementing IAPs using the `cordova-plugin-purchase` plugin.
