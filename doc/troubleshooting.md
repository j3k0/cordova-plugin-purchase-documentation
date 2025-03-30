# Troubleshooting

This page lists common issues encountered when implementing In-App Purchases with the Cordova Purchase plugin (v13+).

## General Setup & Initialization

*   **Plugin Not Found (`CdvPurchase` is undefined):**
    *   **Verify Installation:** Run `cordova plugin ls` (or check `package.json` / `capacitor.config.json`). Ensure `cordova-plugin-purchase` is listed. Reinstall if necessary (`cordova plugin rm cordova-plugin-purchase && cordova plugin add cordova-plugin-purchase`).
    *   **Wait for `deviceready`:** All plugin interactions **must** occur after the `deviceready` event has fired. Accessing `CdvPurchase.store` too early will result in errors.
        ```javascript
        document.addEventListener('deviceready', initializeStore, false);
        function initializeStore() {
          // Access CdvPurchase.store HERE
        }
        ```
    *   **Build Errors:** Check the console output during `cordova prepare`, `cordova build`, `npx cap sync`, or `ionic cap sync` for any errors related to the plugin.
    *   **Capacitor Specific:** Ensure you run `npx cap sync` after adding the plugin. Import might be needed in some setups: `import 'cordova-plugin-purchase';` (often needed for type hints even if not strictly required for runtime). Ensure you access `CdvPurchase` *after* `this.platform.ready()` in Ionic/Angular.
*   **`store.initialize()` Fails or Times Out:**
    *   **Check Device Logs:** This is crucial. Use `adb logcat CordovaPurchase:V CordovaLog:V *:S` for Android or the Xcode Console for iOS/macOS. Look for specific error messages from the native Billing/StoreKit SDKs or the plugin's native bridge.
    *   **Network Connectivity:** The device needs internet access to communicate with the app stores during initialization. Use `cordova-plugin-network-information` to check status.
    *   **Platform Setup:** Double-check platform-specific prerequisites:
        *   **iOS/macOS:** Active "Agreements, Tax, and Banking" in App Store Connect? "In-App Purchase" capability enabled in Xcode? Correct Bundle ID?
        *   **Android:** Correct Package Name? Billing permission in `AndroidManifest.xml`? Signed release build uploaded to a testing track? Test account configured?
    *   **Validator Issues:** If `store.validator` is set, ensure the URL is correct and reachable. Temporarily remove the validator setting to isolate the issue.
*   **Products Not Loading (General):**
    *   **Exact Product IDs:** Verify IDs in `store.register()` **exactly** match those in App Store Connect / Google Play Console (case-sensitive, no extra spaces).
    *   **Product Status:** Ensure products are in an active/approved state ("Ready to Submit" or "Approved" on iOS, "Active" on Android) in the respective consoles.
    *   **Platform Propagation Delay:** Changes in the developer consoles can take **several hours** (sometimes up to 24) to propagate to the sandbox/testing environments. Be patient after creating or modifying products.
    *   **Correct Platform Registration:** Ensure you're registering the product with the correct `platform` enum (`Platform.APPLE_APPSTORE`, `Platform.GOOGLE_PLAY`).
    *   **Initialization Order:** Call `store.register()` *before* `store.initialize()`.

## iOS / App Store Specific (v13+)

*   **Products Not Loading:**
    *   **Agreements:** Re-check "Agreements, Tax, and Banking" in App Store Connect. This is the most common cause. Everything must be active.
    *   **Xcode Capability:** Confirm "In-App Purchase" is enabled in Xcode (`Signing & Capabilities`).
    *   **Bundle ID:** Ensure `config.xml` widget ID matches App Store Connect Bundle ID.
    *   **Device vs Simulator:** Test on a **real device**. Simulators have limited IAP support.
*   **Cannot Make Payments (`offer.canPurchase` is false, or `store.checkSupport('order')` is false):**
    *   **Xcode Capability:** Verify "In-App Purchase" capability.
    *   **Sandbox Tester Account:** Are you logged into a **Sandbox Tester** account on the device? Go to `Settings -> App Store -> Sandbox Account`. **Sign Out** of any production Apple ID first. Create Sandbox testers in App Store Connect -> Users and Access -> Sandbox.
    *   **Device Restrictions:** Check iOS Settings -> Screen Time -> Content & Privacy Restrictions -> iTunes & App Store Purchases -> In-app Purchases -> Allow.
*   **Sandbox Login Prompts Repeatedly / Fails:**
    *   **Log out completely:** Sign out from both the main App Store account *and* the Sandbox account in device settings.
    *   **Sign in ONLY when prompted:** Launch your app, attempt a purchase, and sign in with the Sandbox credentials *only* when the system sheet appears.
    *   **Create New Tester:** Sometimes Sandbox accounts become corrupted. Create a fresh one in App Store Connect.
    *   **Network Issues:** Ensure the device has a stable internet connection.
*   **TestFlight Issues:** Purchases in TestFlight use the production StoreKit environment but don't charge real money. Ensure your build targets the production validator endpoint if needed. Receipt data might differ slightly from pure Sandbox (e.g., no `environment` field in the receipt).
*   **Error Codes (`SKErrorDomain`):** Refer to Apple's `SKError.Code` documentation. Common ones: `paymentCancelled` (user action), `paymentNotAllowed` (restrictions/sandbox issue), `clientInvalid` (setup issue), `storeProductNotAvailable` (product ID mismatch/not approved).

## macOS Specific (v13+)

*   See [macOS Specifics Guide](use-cases/macos-specifics.md).
*   **App Sandbox:** Ensure this capability is enabled with **Outgoing Connections (Client)** checked in Xcode.
*   **Signing Out/In:** **Sign out** of the production Mac App Store application. Sign in with Sandbox Tester account **only when prompted by your app** during a purchase. Do **not** sign in via System Preferences.

## Android / Google Play Specific (v13+)

*   **Products Not Loading:**
    *   **Package Name:** Verify `config.xml` widget `id` matches the Google Play Console Package Name exactly.
    *   **Product Status:** Ensure products are **Active** in the Play Console.
    *   **Signed Build Uploaded:** **Crucial:** Have you uploaded an APK/AAB signed with your **release keystore** to a testing track (Internal, Closed, Open)? Google needs this signature to link purchases, even for testing. Debug builds usually fail.
    *   **Tester Account:** Is the Google account used for testing added as a **License Tester** in the Play Console (`Setup -> License testing`)?
    *   **Primary Account:** Is the tester account the **primary Google account** on the device? Multiple accounts can cause issues.
    *   **Play Store Cache:** Try clearing the cache and data for the Google Play Store app on the test device (`Settings -> Apps -> Google Play Store -> Storage -> Clear Cache / Clear Data`).
*   **Purchase Errors (`BillingResponseCode`):**
    *   **`BILLING_UNAVAILABLE` (Code 3):** Play Store app might be outdated, disabled, or billing is unavailable in the user's country. User might not be logged into a primary Google account. Device might not support required Billing Library version.
    *   **`DEVELOPER_ERROR` (Code 5):** Often indicates incorrect setup or API usage in *your* app (e.g., trying to buy an unknown product, incorrect purchase flow parameters, acknowledging/consuming incorrectly, mismatched signatures between uploaded build and installed build). Check Logcat (`adb logcat CordovaPurchase:V CordovaLog:V *:S`) for detailed native error messages.
    *   **`ITEM_UNAVAILABLE` (Code 4):** Product ID doesn't exist, isn't active, or isn't available in the user's country.
    *   **`ITEM_ALREADY_OWNED` (Code 7):** Trying to buy a non-consumable or subscription already owned by the *current* Google account on the device. Use `store.restorePurchases()` or check `product.owned`.
    *   **`ITEM_NOT_OWNED` (Code 8):** Trying to consume/acknowledge a purchase the user doesn't own or that was already processed.
    *   **`SERVICE_UNAVAILABLE` / `SERVICE_TIMEOUT` / `SERVICE_DISCONNECTED`:** Network issues or problems connecting to Google Play services. The plugin often retries automatically.
*   **Testing Requires Release Builds/Keys:** Reiterate: Testing IAPs generally only works correctly on Android when the app is signed with your **release keystore** and installed via a Play Store testing track.
*   **Emulator Limitations:** Testing IAPs on Android emulators is often unreliable or requires specific configurations (emulators with Google Play Services). Use a real device whenever possible.

## Receipt Validation (v13+)

*   **Connection Errors (Error Code `COMMUNICATION`):**
    *   **URL:** Verify the `store.validator` URL is correct, reachable, and doesn't have typos.
    *   **Network:** Check device network connectivity (`cordova-plugin-network-information`).
    *   **CSP:** Ensure `Content-Security-Policy` in `index.html` allows connections to your validator domain (`connect-src https://your-validator.com;`).
    *   **Server Issues:** Check for server-side firewall issues, validator service downtime, or incorrect API keys/secrets used by the validator. Check validator logs.
    *   **Timeout:** The request might be timing out. Increase `store.validator = { url: '...', timeout: 30000 }`.
*   **Invalid Receipt Errors (Error Code `VERIFICATION_FAILED` or platform-specific codes from validator):**
    *   **Data Sent:** Ensure the plugin is sending the correct data. Check the `receiptValidationBody` implementation in the relevant platform adapter source code (`src/ts/platforms/...`) if needed.
    *   **Validator Logic:** Check your validator's logs. Is it receiving the data correctly? Is it communicating with Apple/Google correctly? Is it using the right environment (Sandbox vs. Production)? Is the Shared Secret (iOS) or Service Account Key (Android) correct and valid?
    *   **Response Format:** Ensure your validator returns data in the format expected by the plugin ([`Validator.Response.Payload`](https://github.com/j3k0/cordova-plugin-purchase/blob/v13/api/interfaces/CdvPurchase.Validator.Response.Payload.md)).
*   **Security Warnings:** Never trust client-side validation logic. Always validate server-side before granting entitlements, especially for subscriptions and non-consumables.

## Subscriptions (v13+)

*   **Expiry Date Incorrect/Missing:** Almost always indicates a lack of **server-side validation** or an issue with your validator's logic. Only a validator communicating with Apple/Google servers can provide the authoritative expiry date and renewal status. Local receipts are unreliable. Ensure your validator returns correct `expiryDate` and `isExpired` fields in the `VerifiedPurchase` objects within the `collection`.
*   **Renewals Not Detected:** Similar to expiry dates, detecting renewals reliably requires server-side validation and potentially Server-to-Server notifications configured on your validator/backend. The plugin relies on the validator to provide the updated status.
*   **`product.owned` is False After Purchase/Validation:**
    *   The `owned` flag relies on the *verified* receipt data if `store.validator` is set. Check the `VerifiedPurchase` data returned by your validator. Is `isExpired` false? Is `expiryDate` in the future?
    *   If *no* validator is used, `owned` relies on local data, which is less reliable, especially for expiry. You might need to manually track ownership based on the `approved` event (insecure) or `finished` event.
*   **Acknowledgement/Finishing:** Ensure `transaction.finish()` or `receipt.finish()` is called *after* successful verification for subscriptions on both platforms.

---

*This is not an exhaustive list. If you encounter issues not listed here, please check device logs (`adb logcat` / Xcode Console), consult platform-specific documentation, and consider opening an issue on the plugin's GitHub repository with detailed information (logs, code snippets, platform versions).*
