---
title: "Troubleshooting (v13+)"
sidebar_position: 3
---


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

## StoreKit 2 Issues (v13.14+)

*   **Purchases work but validation returns unexpected format:**
    *   **Cause:** With `cordova-plugin-purchase-storekit2` installed on iOS 15+, the adapter sends per-transaction JWS tokens (type `apple-sk2`) instead of the monolithic `appStoreReceipt`.
    *   **Solution:** Ensure your validator supports the `apple-sk2` transaction type. If using Iaptic, this is handled automatically. If using a custom validator, update it to accept `jwsRepresentation` fields.

*   **Duplicate transactions or double validation calls after installing StoreKit 2 extension:**
    *   **Cause:** On older plugin versions (< 13.15.2), both SK1 and SK2 observers could fire for the same purchase.
    *   **Solution:** Update to v13.15.2+. The plugin now automatically disables the SK1 payment queue observer when the SK2 extension is detected on iOS 15+.

*   **StoreKit 2 extension not activating (still using SK1):**
    *   **Cause:** The `cordova-plugin-purchase-storekit2` plugin is not installed, or the device runs iOS < 15.
    *   **Solution:** Verify installation (`cordova plugin ls` or check `package.json`). The SK2 extension requires cordova-ios 7+ (tested with cordova-ios 8). On iOS < 15, SK1 is used automatically -- this is expected behavior.

*   **`store.getStorefront()` returns error on Mac Catalyst:**
    *   **Cause:** SK1's `SKPaymentQueue.storefront` returns nil on Mac Catalyst / "Designed for iPad" mode.
    *   **Solution:** Update to v13.15.1+ and install `cordova-plugin-purchase-storekit2` v1.0.3+. The plugin falls back to SK2's `Storefront.current` automatically.

*   **Sandbox sign-in dialog loops endlessly (iOS):**
    *   **Cause:** The app receipt fails to load, and the native transaction never finishes, causing repeated sign-in prompts.
    *   **Solution:** Update to v13.15.3+. The plugin now falls back to a synthetic receipt so the transaction resolves instead of looping.

*   **Existing subscriptions not visible after app relaunch (Capacitor + SK2):**
    *   **Cause:** On earlier versions, current entitlements were not emitted on init.
    *   **Solution:** Update to v13.15.2+. The Capacitor SK2 plugin now emits current entitlements as restored transactions on `init()`.

## Capacitor Installation Issues (v13.15+)

*   **`npx cap sync ios` fails with missing `Package.swift` or podspec:**
    *   **Cause:** Earlier versions of `capacitor-plugin-cdv-purchase` omitted the SPM manifest and root podspec from the npm tarball.
    *   **Solution:** Update to `capacitor-plugin-cdv-purchase` v13.15.2+. Both `Package.swift` (for Capacitor 8/SPM) and `CapacitorPluginCdvPurchase.podspec` (for Capacitor 6-7/CocoaPods) are now included.

*   **Peer dependency conflict with Capacitor 7 or 8:**
    *   **Cause:** The `@capacitor/core` peer dependency was pinned to `^6.0.0`.
    *   **Solution:** Update to `capacitor-plugin-cdv-purchase` v13.15.2+ which supports `^6.0.0 || ^7.0.0 || ^8.0.0`.

*   **`CdvPurchase` undefined in Capacitor app:**
    *   **Cause:** The plugin was not synced or the Capacitor bridge has not loaded yet.
    *   **Solution:** Run `npx cap sync` after installing. Access `CdvPurchase.store` only after `Capacitor.Plugins` is ready. In Ionic, use `this.platform.ready()`.

*   **Using both Cordova plugin and Capacitor plugin simultaneously:**
    *   **Cause:** Installing both `cordova-plugin-purchase` (via Cordova compatibility) and `capacitor-plugin-cdv-purchase` causes conflicts.
    *   **Solution:** Use only one. For Capacitor apps, prefer `capacitor-plugin-cdv-purchase`. Remove the Cordova plugin: `npm uninstall cordova-plugin-purchase` then `npx cap sync`.

## Multi-Quantity Purchase Issues (v13.15+)

*   **`quantity` parameter ignored on iOS:**
    *   **Cause:** Multi-quantity requires `cordova-plugin-purchase` v13.15.0+ on iOS.
    *   **Solution:** Update to v13.15.0+. Verify the platform supports it:
        ```javascript
        if (!store.checkSupport(CdvPurchase.Platform.APPLE_APPSTORE, 'orderQuantity')) {
          console.warn('Multi-quantity not supported on this platform version');
        }
        ```

*   **`quantity` not appearing in `VerifiedPurchase`:**
    *   **Cause:** Your validator does not return the `quantity` field, or you are on an older plugin version.
    *   **Solution:** Update to v13.15.0+. Ensure your validator extracts and returns the quantity from the transaction data. If using Iaptic, this is handled automatically.

*   **Apple rejects quantity > 10:**
    *   **Cause:** Apple limits consumable purchases to 10 units per transaction.
    *   **Solution:** Cap the quantity picker at 10. For larger quantities, perform multiple sequential purchases or adjust your product's unit value.

## Google Play Billing 8.x Issues (v13.13+)

*   **Build fails with `minSdkVersion` error:**
    *   **Cause:** Google Play Billing Library 8.1+ requires `minSdkVersion` 23.
    *   **Solution:** In `config.xml` or `build.gradle`, set `minSdkVersion` to 23 or higher:
        ```xml
        <preference name="android-minSdkVersion" value="23" />
        ```

*   **Suspended subscriptions now appear as "owned" locally but validation says expired:**
    *   **Cause:** Google Play now returns suspended (paused / payment-on-hold) subscriptions in the purchases list (aligning with Apple). The local transaction exists but the subscription is not active.
    *   **Solution:** This is expected behavior. Always rely on `store.owned()` (which checks validated expiry) rather than the presence of a local transaction. The `expirationDate` on suspended subscriptions is in the past, so `store.owned()` correctly returns `false`.

*   **"Product Owned" event never fires (Android):**
    *   **Cause:** On v13.15.3 and earlier, a null `AccountIdentifiers` from the Play Billing Library could crash the purchase-to-JS serialization silently.
    *   **Solution:** Update to v13.15.3+ which includes a null-guard for `Purchase.getAccountIdentifiers()`.

## Store Blocked by OEM (v13.16.1+)

*   **`ERR_STORE_BLOCKED` (`ErrorCode.STORE_BLOCKED`) on Android:**
    *   **Cause:** On devices where the Google Play Store is blocked by the device manufacturer (e.g., some Huawei or Amazon devices that lack Google Play Services), `store.order()` fails with `ERR_STORE_BLOCKED`. This error was added in v13.16.1 alongside Google Play Billing Library v9.
    *   **Solution:** Handle this gracefully in your app:
        ```javascript
        store.when().error(error => {
            if (error.code === CdvPurchase.ErrorCode.STORE_BLOCKED) {
                // Show a user-friendly message: "In-app purchases are not available on this device"
            }
        });
        ```
    *   **Note:** This is different from `ERR_SETUP` (the store is configured but not ready) and `ERR_UNAVAILABLE` (the store is not available on the device). `ERR_STORE_BLOCKED` specifically means the store app is present but blocked from making purchases by OEM restrictions.

---

*This is not an exhaustive list. If you encounter issues not listed here, please re-check device logs, consult platform-specific documentation (StoreKit, Google Play Billing), and consider opening an issue on the plugin's GitHub repository with detailed information (logs, code snippets, platform versions).*
