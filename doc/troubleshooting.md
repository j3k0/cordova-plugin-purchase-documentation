# Troubleshooting (v13+)

This page lists common issues encountered when implementing In-App Purchases with the Cordova Purchase plugin (v13+).

**First Steps:**

1.  **Enable Debug Logging:** Set `CdvPurchase.store.verbosity = CdvPurchase.LogLevel.DEBUG;` early in your code (after `deviceready` but before `initialize`) to get detailed logs.
2.  **Check Device Logs:** This is crucial.
    *   **Android:** Use `adb logcat CordovaPurchase:V CordovaLog:V chromium:D *:S` (or similar filters) via Android Studio or command line. Look for messages tagged `CordovaPurchase` or from the native Billing Library.
    *   **iOS/macOS:** Use the Xcode Console (Window -> Devices and Simulators -> Select Device -> Open Console). Filter for messages related to your app or StoreKit.
3.  **Verify Plugin Version:** Ensure you are using `cordova-plugin-purchase` v13 or later (`cordova plugin ls`).

## General Setup & Initialization Issues

*   **`CdvPurchase` or `CdvPurchase.store` is undefined:**
    *   **Cause:** Accessing the plugin *before* the `deviceready` event fires.
    *   **Solution:** Ensure all plugin interactions (`CdvPurchase.store...`) happen inside or after the `deviceready` event listener callback. For Ionic/Capacitor, use `this.platform.ready().then(() => { ... });`.
    *   **Cause:** Plugin not installed correctly or build issue.
    *   **Solution:** Verify installation (`cordova plugin ls`). Remove and re-add the plugin. Check for build errors (`cordova prepare/build`, `npx cap sync`). For Capacitor, ensure `npx cap sync` was run after adding the plugin.
*   **`store.initialize([...])` Fails or Returns Errors:**
    *   **Check Device Logs:** Look for specific native errors (StoreKit, BillingClient).
    *   **Network Connectivity:** Device needs internet access. Use `cordova-plugin-network-information` to check status.
    *   **Platform Setup:** Double-check all platform-specific prerequisites (see Setup guides in Use Cases). This is a very common source of errors.
        *   *iOS/macOS:* Active "Agreements, Tax, and Banking" in App Store Connect? "In-App Purchase" capability enabled in Xcode? Correct Bundle ID?
        *   *Android:* Correct Package Name? `BILLING` permission in `AndroidManifest.xml` (added automatically by plugin)? Signed release build uploaded to a testing track? Test account configured on device and in Play Console?
    *   **Validator Issues:** If `store.validator` is set, ensure the URL is correct, reachable, and your server is running. Temporarily remove the validator setting to isolate the issue. Check server logs.
    *   **Invalid Platform Argument:** Ensure you pass an array of `Platform` enums or `PlatformWithOptions` objects to `initialize()`, e.g., `store.initialize([Platform.APPLE_APPSTORE])`.
*   **`store.ready()` Callback Never Fires:**
    *   **Cause:** `store.initialize()` failed or never completed.
    *   **Solution:** Check for errors during initialization (see above). Ensure `initialize()` is actually being called.

## Product Loading Issues

*   **Products Not Loading (Empty `store.products` or `productUpdated` not firing):**
    *   **Initialization Order:** Call `store.register([...])` *before* calling `store.initialize([...])`.
    *   **Exact Product IDs:** Verify IDs in `store.register()` **exactly** match those in App Store Connect / Google Play Console (case-sensitive, no extra spaces).
    *   **Correct Platform:** Ensure the `platform` specified in `store.register()` matches the platform you are running on and initializing.
    *   **Product Status:** Ensure products are in an active/approved state ("Ready to Submit" or "Approved" on iOS, "Active" on Android) in the respective consoles. They must be "Cleared for Sale" (iOS) or have a price set (Android).
    *   **Platform Propagation Delay:** Changes in App Store Connect / Play Console can take **several hours** (sometimes up to 24) to become available in the sandbox/testing environments. Be patient after creating or modifying products.
    *   **Check Device Logs:** Look for specific errors during the product loading phase after `initialize()`.
    *   **(iOS) Agreements:** Re-check "Agreements, Tax, and Banking" in App Store Connect. Inactive agreements prevent product loading.
    *   **(Android) Signed Build:** Ensure a signed release build has been uploaded to a testing track in the Play Console. Product loading often fails without this.

## Purchase Flow Issues

*   **`offer.order()` or `store.requestPayment()` Fails Immediately:**
    *   **Check `offer.canPurchase` / `store.checkSupport()`:** Is the product/offer loaded and marked as purchasable? Is the platform adapter ready and does it support ordering/payments?
    *   **Platform Setup:** Re-verify platform prerequisites (Agreements, Capabilities, Test Accounts).
    *   **(iOS) Sandbox Account:** Are you logged into a **Sandbox Tester** account on the device (`Settings -> App Store -> Sandbox Account`)? Sign out of production accounts first.
    *   **(iOS) Device Restrictions:** Check iOS Settings -> Screen Time -> Content & Privacy Restrictions -> iTunes & App Store Purchases -> In-app Purchases -> Allow.
    *   **(Android) Test Account:** Is the primary account on the device a configured License Tester? Is the app installed via the Play Store testing track?
    *   **Check Device Logs:** Look for immediate errors from the native SDK.
*   **Purchase Dialog Appears but Fails/Errors Out:**
    *   **Check Device Logs:** Critical for diagnosing platform-specific payment errors (e.g., invalid payment method, network issues during authorization).
    *   **Sandbox/Test Environment Issues:** Platform test environments can sometimes be unstable. Try again later or with a different test account.
    *   **(iOS) Sandbox Login Prompts Repeatedly / Fails:** Log out completely (App Store + Sandbox). Sign in *only* when prompted by the app during purchase. Try a new Sandbox Tester account.
*   **`.approved()` Callback Not Firing After Successful Payment UI:**
    *   **Cause:** Native event listener might not be set up correctly or an earlier error occurred.
    *   **Solution:** Ensure `store.initialize()` completed successfully. Check for any errors logged *before* the purchase attempt. Verify the `store.when().approved(...)` listener is correctly registered *before* the purchase is initiated. Check device logs for native listener issues.
*   **`.verified()` Callback Not Firing After `.approved()`:**
    *   **Cause:** Receipt validation failed.
    *   **Solution:** Check `store.error()` or `.unverified()` listeners for validation errors. Verify your `store.validator` URL/function. Check your validation server logs for errors (communication with Apple/Google, invalid receipt data, API key issues). Check network connectivity from the device *and* the server. Ensure CSP allows connection to the validator URL.
*   **`.finished()` Callback Not Firing After `.verified()`:**
    *   **Cause:** Error during the native `finishTransaction` call or the `.verified()` callback threw an unhandled exception before `receipt.finish()` was called.
    *   **Solution:** Check device logs for errors during the finish call. Ensure your `.verified()` logic correctly calls `receipt.finish()` and doesn't throw errors beforehand.

## Receipt Validation Issues

*   **Validation Request Fails (Error Code `COMMUNICATION` or `BAD_RESPONSE`):**
    *   **URL/Endpoint:** Verify `store.validator` URL is correct, reachable, and doesn't have typos.
    *   **Network:** Check device network connectivity. Check server network connectivity (can it reach Apple/Google?).
    *   **CORS (If using browser-based validation):** Ensure your server sends correct CORS headers. Using `cordova-plugin-advanced-http` can bypass browser CORS issues.
    *   **CSP:** Ensure `Content-Security-Policy` in `index.html` allows connections to your validator domain (`connect-src https://your-validator.com;`).
    *   **Server Issues:** Check validator server logs. Firewall issues? Service downtime? Incorrect API keys/secrets used by the validator? Invalid request format received?
    *   **Timeout:** Request might be timing out. If using `Validator.Target`, increase the `timeout` value. Check server processing time.
*   **Validation Fails (Error Code `VERIFICATION_FAILED` or platform-specific codes):**
    *   **Check Validator Logs:** Essential for diagnosis. Why did the server reject the validation?
    *   **Incorrect Environment:** Is your validator calling the correct Apple/Google endpoint (Sandbox vs. Production)? Receipts generated in Sandbox must be validated against the Sandbox endpoint, and vice-versa.
    *   **Invalid Credentials:** Is the App-Specific Shared Secret (iOS) or Service Account Key (Android) used by the validator correct and valid?
    *   **Invalid Receipt Data:** Was the receipt data corrupted before sending? Is the plugin sending the correct fields? (Check `receiptValidationBody` in adapter source if necessary).
    *   **Incorrect Validator Logic:** Is your server correctly parsing the platform response and determining entitlement?

## Subscription Issues

*   **Subscription Status Incorrect (`product.owned`, Expiry Date):**
    *   **Cause:** Almost always due to lack of **server-side receipt validation** or incorrect validator logic.
    *   **Solution:** Implement or fix your `store.validator`. Only a validator communicating with Apple/Google servers can provide the authoritative expiry date, renewal status, grace period status, etc. Do not rely on local `Receipt` or `Transaction` data for subscription status. Ensure your validator returns correct `expiryDate`, `isExpired`, `renewalIntent` etc. in the `VerifiedPurchase` objects.
*   **Renewals Not Detected / Status Not Updating:**
    *   **Cause:** Lack of receipt validation or validator not being called periodically.
    *   **Solution:** Use `store.validator`. Call `store.update()` periodically or when the user visits relevant screens to refresh validated status. Implement server-to-server notifications from Apple/Google to your backend for real-time updates (handled by services like Iaptic).
*   **Cannot Upgrade/Downgrade:**
    *   **(iOS):** Ensure products are in the same **Subscription Group** in App Store Connect.
    *   **(Android):** Ensure products are registered with the same `group` in `store.register()`. Pass the correct `oldPurchaseToken` and `replacementMode` in `additionalData` when calling `offer.order()`. Check device logs for specific Billing Library errors.

---

*This is not an exhaustive list. If you encounter issues not listed here, please re-check device logs, consult platform-specific documentation (StoreKit, Google Play Billing), and consider opening an issue on the plugin's GitHub repository with detailed information (logs, code snippets, platform versions).*
