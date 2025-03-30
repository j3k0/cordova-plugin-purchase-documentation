### 7. (Recommended) Setup Receipt Validation Service

For subscriptions (and non-consumables), **server-side receipt validation is essential** for security and reliable status tracking. Do not rely solely on the device's local data.

{% hint style="info" icon="info" %}
**Receipt Validation Reminder**

Remember, for subscriptions and non-consumables, relying solely on local device data is insecure and unreliable for managing entitlements.

**Always implement server-side receipt validation** using your own backend or a service like [Iaptic](https://www.iaptic.com/) to:
*   Confirm purchase legitimacy.
*   Get the authoritative subscription status and expiry date.
*   Prevent fraud.
*   Support cross-platform/device access.

Ensure `store.validator` is configured in your `initStore()` function.
{% endhint %}
**Options:**

1.  **Use Iaptic (Recommended):**
    *   [Iaptic](https://www.iaptic.com/) is a service designed specifically for validating receipts from Cordova/Capacitor apps, handling complexities across platforms.
    *   Sign up and get your API Key and App Name.
    *   Configure the plugin using the `Iaptic` helper class:

        ```javascript
        const { store } = CdvPurchase;
        const iaptic = new CdvPurchase.Iaptic({
          appName: 'YOUR_IAPTIC_APP_NAME',
          apiKey: 'YOUR_IAPTIC_API_KEY'
        });
        store.validator = iaptic.validator;

        // For introductory/promotional offer eligibility:
        store.initialize([{
          platform: CdvPurchase.Platform.APPLE_APPSTORE,
          options: {
            discountEligibilityDeterminer: iaptic.appStoreDiscountEligibilityDeterminer,
            // needAppReceipt: true // Required if using eligibility determiner
          }
        }]);
        ```
    *   You will also need the **App-Specific Shared Secret** from App Store Connect for Iaptic to validate iOS receipts. Enter this secret in your Iaptic application settings.

First, I assume you have an Apple developer account. If not time to register, because it's mandatory.

Let's now head to the [AppStore Connect](https://appstoreconnect.apple.com) website. In order to start developing and testing In-App Purchases, you need all contracts in place as well as your financial information setup. Make sure there are no warning left there.

I'll not guide you through the whole procedure, just create setup your Apple application as usual.

#### Retrieve the Shared Secret

Since you are here, let's retrieve the Shared Secret. You can use an App-Specific one or a Master Shared Secret, at your convenience: both will work. Keep the value around, it'll be required, especially if you are implementing subscriptions.

![](../.gitbook/assets/appstore-shared-secret.png)




2.  **Build Your Own Server:**
    *   Requires significant backend development.
    *   You'll need to call Apple's `verifyReceipt` endpoint: [Apple Verify Receipt Docs](https://developer.apple.com/documentation/appstorereceipts/verifyreceipt).
    *   Handle sandbox vs. production endpoints.
    *   Store and manage subscription status, expiry dates, and renewal events.
    *   Implement secure communication between your app and your server.
    *   Set `store.validator` to your server's endpoint URL.
    *   You will need the **App-Specific Shared Secret** for your server logic.

**Choosing not to validate receipts server-side will lead to unreliable subscription status, inability to handle renewals/cancellations correctly, and significant security vulnerabilities.**