# Using the Test Platform

This guide explains how to leverage the built-in `Test` platform adapter (`CdvPurchase.Platform.TEST`) for local development and testing of your In-App Purchase logic.

**Purpose:**

The Test platform simulates basic purchase flows **without connecting to any real app stores** (App Store, Google Play) or payment gateways. It's useful for:

*   **Rapid UI Development:** Quickly build and test your store interface, product display, and button interactions.
*   **Basic Logic Testing:** Verify your event handling logic (`approved`, `verified`, `finished`, `cancelled`) in a controlled environment.
*   **Offline Development:** Work on IAP integration without needing network connectivity or configured test accounts.
*   **Demonstrations:** Show purchase flows without involving real money or complex setup.

**Limitations:**

*   **No Real Transactions:** It does **not** involve any actual payments or communication with Apple/Google servers.
*   **Mock Validation:** Calling `transaction.verify()` triggers an immediate, simulated success response. It does **not** perform real server-side validation.
*   **Simplified Behavior:** It uses JavaScript `prompt()` for purchase confirmation and doesn't replicate platform-specific UI or complex scenarios (pending purchases, detailed errors, subscription management nuances).
*   **No Real Product Data:** Uses built-in mock products or custom definitions provided during registration, not live data from app stores.

**Use Cases:** Focus on testing your application's UI flow and basic event handling logic. **Do not** rely on it for testing security, real-world edge cases, or the specifics of subscription renewals/management.

**Always test thoroughly on real devices using actual platform Sandbox/Test accounts before releasing your application.**

The [Code Implementation](test-platform-code.md) section details how to set up and use the Test platform.
