# Troubleshooting

This page lists common issues encountered when implementing In-App Purchases with the Cordova Purchase plugin.

## General Setup

*   **Plugin Not Found (`CdvPurchase` is undefined):**
    *   Ensure the plugin is correctly installed (`cordova plugin ls`).
    *   Make sure you're waiting for the `deviceready` event before accessing `CdvPurchase.store`.
    *   Check for any build errors during `cordova prepare` or `cordova build`.
    *   For Capacitor, ensure you `import 'cordova-plugin-purchase';` and access `CdvPurchase` after `platform.ready()`.
*   **`store.initialize()` Fails:**
    *   Check device logs (`adb logcat` for Android, Xcode Console for iOS) for specific error messages from the native SDKs.
    *   Verify network connectivity.
    *   Ensure platform-specific setup (Billing Key, Xcode Capabilities) is correct.

## iOS / App Store Specific

*   **Products Not Loading:**
    *   Verify Bundle ID matches App Store Connect exactly.
    *   Ensure Products are in the "Ready to Submit" or "Approved" state in App Store Connect.
    *   Confirm "Agreements, Tax, and Banking" are complete and active.
    *   Check that the "In-App Purchase" capability is enabled in Xcode.
    *   Wait several hours after creating products; propagation takes time.
    *   Are you testing on a real device? Simulators don't fully support IAP.
*   **Cannot Make Payments:**
    *   Is the "In-App Purchase" capability enabled in Xcode?
    *   Are you logged in with a **Sandbox Tester** account on the device? (Settings -> App Store -> Sandbox Account). **Do not** use your regular Apple ID.
    *   Is the device restricted from making purchases? (Screen Time settings)
*   **Sandbox Login Prompts Repeatedly:**
    *   Try logging out of the Sandbox account (Settings -> App Store -> Sandbox Account) and logging back in when prompted by the app.
    *   Create a new Sandbox Tester account.
*   **Error Codes (`SKErrorDomain`):**
    *   Refer to Apple's `SKError.Code` documentation for specific error meanings. Common ones include `paymentCancelled`, `paymentNotAllowed`, `clientInvalid`.

## macOS Specific

*   See [macOS Specifics Guide](../use-cases/macos-specifics.md).
*   Ensure **App Sandbox** capability is enabled with **Outgoing Connections (Client)** checked in Xcode.
*   **Sign out** of the production Mac App Store. Sign in with Sandbox Tester account **only when prompted by your app** during a purchase attempt.

## Android / Google Play Specific

*   **Products Not Loading:**
    *   Verify Package Name matches Google Play Console exactly.
    *   Ensure products are **Active** in the Play Console.
    *   Have you uploaded an APK/AAB (even to Internal Testing) signed with the **same key** used for your test build? Google needs to know your app's signature.
    *   Wait several hours after creating products.
*   **Purchase Errors (`BillingResponseCode`):**
    *   `BILLING_UNAVAILABLE`: Play Store app might be outdated, disabled, or billing is unavailable in the user's country. User might not be logged into a Google account.
    *   `DEVELOPER_ERROR`: Often indicates incorrect setup in the app (e.g., trying to buy an unknown product, incorrect purchase flow). Check Logcat for details.
    *   `ITEM_UNAVAILABLE`: Product ID doesn't exist or isn't active in the Play Console.
    *   `ITEM_ALREADY_OWNED`: Trying to buy a non-consumable or subscription already owned by the *current* Google account on the device. Use "Restore Purchases".
    *   `ITEM_NOT_OWNED`: Trying to consume a purchase the user doesn't own.
*   **Testing Requires Release Builds:** In-App Purchases generally only work correctly on Android when the app is signed with your **release keystore** (the same one used for Play Store uploads). Debug builds often fail. Use internal testing tracks on Google Play.
*   **Emulator Limitations:** Testing IAPs on Android emulators is often unreliable or impossible. Use a real device with a Google account added.
*   **Billing Key:** Ensure the `BILLING_KEY` preference in `config.xml` (if used by older plugin versions or specific setups) or the key used for server-side validation is correct. *(Note: Plugin v13 primarily relies on server validation, not a client-side key).*

## Receipt Validation

*   **Connection Errors:**
    *   Verify the `store.validator` URL is correct and reachable from the device.
    *   Check network connectivity.
    *   Ensure `Content-Security-Policy` in `index.html` allows connections to your validator domain.
*   **Invalid Receipt Errors:**
    *   Ensure you're sending the correct, complete receipt data (e.g., `appStoreReceipt` for iOS, `purchaseToken` + `receipt`/`signature` for Android).
    *   Check if the validator environment matches the purchase environment (Sandbox vs. Production). Iaptic handles this automatically.
*   **Security Warnings:** Never trust client-side validation. Always validate server-side before granting entitlements.

## Subscriptions

*   **Expiry Date Incorrect/Missing:** This usually indicates a lack of server-side validation. Only a validator communicating with Apple/Google servers can provide the authoritative expiry date.
*   **Renewals Not Detected:** Similar to expiry dates, detecting renewals reliably requires server-side validation and potentially Server-to-Server notifications.
*   **`product.owned` is False After Purchase:** The `owned` flag is updated *after* successful receipt validation if a validator is configured. If no validator is used, rely on local receipt data (less reliable) or manually track ownership after purchase.

---

*This is not an exhaustive list. If you encounter issues not listed here, please check device logs (`adb logcat` / Xcode Console) and consider opening an issue on the plugin's GitHub repository with detailed information.*