### 9. Setup Receipt Validation Server (Google Play)

Reliably managing Android subscriptions, especially determining the exact expiry date and renewal status, requires communication with the **Google Play Developer API**. The purchase plugin itself does not directly communicate with this server-side API. You need an intermediary service for this, often referred to as a receipt validation server.

While you can build your own server to interact with the Google Play Developer API, this guide will use **Iaptic** (the service developed by the plugin's author) which simplifies this process.

**Why is this needed for Android Subscriptions?**

*   **Accurate Expiry Dates:** Local receipt data on Android doesn't always contain a reliable expiry date, especially after renewals or cancellations. The Google Play Developer API is the source of truth.
*   **Renewal Status:** Checking if a subscription will auto-renew or has been cancelled requires server-side checks.
*   **Grace Periods & Account Hold:** Handling billing issues requires server-side status information.

**Steps using Iaptic:**

1.  **Create an Iaptic Account:** If you haven't already, sign up at [iaptic.com](https://www.iaptic.com/).
2.  **Connect with Google Play Developer API:**
    *   Navigate to your Iaptic project settings.
    *   Find the "Google Play" section.
    *   Follow the instructions provided by Iaptic to connect your Google Play Developer account. This typically involves:
        *   Creating a **Service Account** in your Google Cloud Console project that is linked to your Google Play Developer Console.
        *   Granting the necessary permissions (like "View financial data" and "Manage orders and subscriptions") to this Service Account within the Google Play Console.
        *   Uploading the JSON key file for the Service Account to Iaptic.
    *   Iaptic provides detailed guides for this process: [Connect With Google](https://www.iaptic.com/documentation/connect-with-google-publisher-api/)
3.  **Configure the Plugin:**
    *   Go to the "Setup" section in your Iaptic dashboard and find the "Cordova" setup instructions.
    *   Copy the provided `store.validator` URL. It will look something like `https://validator.iaptic.com/...`.
    *   Paste this URL into your application's initialization code where you configure the store validator:

    ```javascript
    // In your initStore() or equivalent function
    const iaptic = new CdvPurchase.Iaptic({
      appName: "[Your Iaptic App Name]", // Replace with your actual App Name
      apiKey: "[Your Iaptic Public Key]" // Replace with your actual Public Key
    });
    CdvPurchase.store.validator = iaptic.validator;
    ```

    *   Ensure your `Content-Security-Policy` in `index.html` allows connections to `validator.iaptic.com` (or your custom Iaptic domain).

{% hint style="info" %}
Iaptic's validation service is often free or has a generous free tier during development (using test purchases) and offers paid plans for production use. Check their pricing for details.
{% endhint %}

{% hint style="warning" %}
Skipping this server-side validation step for Android subscriptions will lead to unreliable expiry date information and difficulty in managing subscription states correctly.
{% endhint %}

With the validator configured and connected to the Google Play Developer API, the plugin, via Iaptic, can now retrieve accurate subscription details during the validation process.