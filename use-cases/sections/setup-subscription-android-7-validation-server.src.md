### 7. (Recommended) Setup Receipt Validation Service

For subscriptions (and non-consumables), **server-side receipt validation is essential** for security and reliable status tracking.

!INCLUDE "../sections/receipt-validation-reminder.md"

**Options:**

1.  **Use Iaptic (Recommended):**
    *   [Iaptic](https://www.iaptic.com/) handles the complexities of validating Google Play receipts, including the newer SubscriptionV2 API required for Billing Library v5+.
    *   Sign up and get your API Key and App Name.
    *   Configure the plugin:

        ```javascript
        const { store } = CdvPurchase;
        const iaptic = new CdvPurchase.Iaptic({
          url: 'https://validator.iaptic.com', // Or your custom endpoint
          appName: 'YOUR_IAPTIC_APP_NAME',
          apiKey: 'YOUR_IAPTIC_API_KEY'
        });
        store.validator = iaptic.validator;

        store.initialize([CdvPurchase.Platform.GOOGLE_PLAY]);
        ```
    *   You will need to provide Iaptic with your **Google Play Developer API credentials** (Service Account JSON key). Follow Iaptic's setup guide for instructions.
!INCLUDE "setup-android-3-create-play-store-application.md"

2.  **Build Your Own Server:**
    *   Requires significant backend development using the [Google Play Developer API](https://developers.google.com/android-publisher).
    *   Specifically, use the `purchases.subscriptionsv2.get` endpoint: [Google Subscription Purchase Get Docs](https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2/get).
    *   Handle API authentication using a Service Account.
    *   Store and manage subscription status, expiry dates, and renewal events.
    *   Implement secure communication.
    *   Set `store.validator` to your server's endpoint URL.
    *   You will need your **Service Account JSON Key**.

**Skipping server-side validation for Google Play subscriptions is highly problematic as local receipts often lack accurate expiry dates and renewal status information.**