# The Importance of Receipt Validation

While the `cordova-plugin-purchase` allows you to interact with platform SDKs to initiate purchases and get basic transaction information locally, relying solely on client-side data for granting access to paid features or content is **highly discouraged** due to significant security risks and functional limitations.

**Server-side receipt validation is crucial for:**

1.  **Security:**
    *   **Preventing Fraud:** Local device data can be easily manipulated (jailbroken/rooted devices, modification tools). Without server validation, users could potentially unlock paid content without actually paying. A validation server confirms the purchase legitimacy directly with Apple/Google servers.
    *   **Authenticity:** Ensures the receipt actually came from the official App Store or Google Play and hasn't been forged.

2.  **Reliable Entitlement Management:**
    *   **Accurate Subscription Status:** Local receipts (especially on Android) often lack reliable, up-to-date information about subscription expiry dates, renewal status (active, cancelled, grace period, billing issue), and introductory offer eligibility. The *only* source of truth for this information is the platform's server API (App Store Server API / Google Play Developer API).
    *   **Cross-Platform/Device Access:** If users can access their account on multiple devices or platforms, the entitlement must be managed centrally on your server, linked to their user account, not just the device's store account.
    *   **Handling Edge Cases:** Correctly managing grace periods, billing retries, account holds, refunds, and cancellations requires server-side checks.

**The Typical Flow with Validation:**

1.  **Client (App):** User initiates purchase via `store.order()`.
2.  **Client (App):** Plugin receives `approved` event with transaction data.
3.  **Client (App):** Calls `transaction.verify()` (or sends receipt data to your backend).
4.  **Validation Server (Your Server / Iaptic):** Receives receipt data from the client.
5.  **Validation Server:** Sends the receipt data to Apple/Google for validation.
6.  **Validation Server:** Receives validation response (success/failure, detailed purchase info like expiry date).
7.  **Validation Server:** Updates the user's entitlement status in *your* database (e.g., marks subscription as active until expiry date).
8.  **Validation Server:** Sends verified status back to the client.
9.  **Client (App):** Receives `verified` event. Calls `receipt.finish()` to acknowledge the purchase to the platform (stops repeated `approved` events).
10. **Client (App):** Unlocks content based on the *validated* entitlement status (either from the `verified` event data or by querying your backend).

**What happens if you skip validation?**

*   Your app is vulnerable to simple purchase hacking.
*   You cannot reliably determine the current status or expiry date of subscriptions.
*   You cannot easily grant access across multiple devices tied to a user account.
*   You cannot properly handle refunds, cancellations, or billing issues initiated outside the app.

**Recommendation:**

**Always use server-side receipt validation**, especially for non-consumable products and subscriptions. You can:

*   Build your own validation server (complex).
*   Use a service like [Iaptic](https://www.iaptic.com/) (recommended, handles complexities for you).

While the plugin provides access to local transaction data, treat it as provisional until validated server-side.