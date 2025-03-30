# The Importance of Receipt Validation

While the `cordova-plugin-purchase` allows you to interact with platform SDKs to initiate purchases and get basic transaction information locally, relying solely on client-side data for granting access to paid features or content is **highly discouraged** due to significant security risks and functional limitations.

**Server-side receipt validation is crucial for:**

1.  **Security & Authenticity:**
    *   **Preventing Fraud:** Local device data can be easily manipulated (jailbroken/rooted devices, memory editors, modification tools). Without server validation, users could potentially trigger `approved` events or modify local state to unlock paid content without actually paying. A validation server confirms the purchase legitimacy directly with Apple/Google servers using cryptographic verification.
    *   **Authenticity:** Ensures the receipt data actually originated from the official App Store or Google Play and hasn't been forged or replayed.

2.  **Reliable Entitlement Management:**
    *   **Accurate Subscription Status:** Local receipts (especially on Android, but also sometimes on iOS due to delays) often lack reliable, up-to-date information about subscription expiry dates, renewal status (active, cancelled, grace period, billing issue), and introductory offer eligibility. The **only** source of truth for this information is the platform's server API (App Store Server API / Google Play Developer API).
    *   **Cross-Platform/Device Access:** If users can access their account on multiple devices or platforms (web, iOS, Android), the entitlement (what they own) must be managed centrally on *your* server, linked to *their user account*, not just the device's store account.
    *   **Handling Edge Cases:** Correctly managing grace periods, billing retries, account holds, refunds, cancellations initiated outside the app (e.g., via App Store settings), and family sharing requires server-side checks and state management.

**The Recommended Flow with Validation:**

1.  **Client (App):** User initiates purchase via `store.order()` or `store.requestPayment()`.
2.  **Platform:** Handles payment UI and authorization.
3.  **Client (App):** Plugin receives `approved` event with transaction data (including receipt fragments). **Do NOT grant entitlement yet.**
4.  **Client (App):** Calls `transaction.verify()`.
5.  **Plugin:** Sends necessary receipt data to the configured `store.validator` endpoint (your server or a service like Iaptic).
6.  **Validation Server:** Receives receipt data.
7.  **Validation Server:** Sends the receipt data to Apple/Google's validation endpoint using appropriate credentials (Shared Secret/Service Account Key).
8.  **Apple/Google:** Validates the receipt and returns the authoritative purchase status (including latest transactions, expiry dates, etc.).
9.  **Validation Server:** Parses the response, determines the user's entitlement status (e.g., "premium access until YYYY-MM-DD").
10. **Validation Server:** Updates the user's entitlement status in *your* database (linked to *your* user account ID).
11. **Validation Server:** Sends a structured success response back to the plugin, often including the verified purchase details (`VerifiedPurchase` objects).
12. **Client (App):** Plugin receives the validation response and triggers the `verified` event with a `VerifiedReceipt`.
13. **Client (App):** In the `verified` handler:
    *   Call `receipt.finish()` to acknowledge the purchase to the platform (stops repeated `approved` events).
    *   **Grant entitlement:** Unlock features/content based on the *validated* data in the `VerifiedReceipt` or by checking the user's status on your backend.

**What happens if you skip validation?**

*   Your app is vulnerable to simple purchase hacking and fraud.
*   You cannot reliably determine the current status or expiry date of subscriptions.
*   You cannot easily grant access across multiple devices tied to a user account.
*   You cannot properly handle refunds, cancellations, or billing issues initiated outside the app.
*   Your `product.owned` status will be based on potentially unreliable local data.

**Recommendation:**

**Always use server-side receipt validation**, especially for non-consumable products and subscriptions. You can:

*   Build your own validation server (complex, requires ongoing maintenance).
*   Use a service like [Iaptic](https://www.iaptic.com/) (recommended, handles platform complexities, API changes, and provides a unified response).

While the plugin provides access to local transaction data via `store.localReceipts`, treat it as provisional and **never** grant permanent or high-value entitlements based solely on it. Use the `store.verifiedReceipts` and `store.verifiedPurchases` collections after successful validation as your source of truth on the client-side, or better yet, query your own backend which should be updated by the validator.