## Setup for Braintree Payments

This guide details the necessary steps to configure your development environment, Braintree account, and application settings before implementing custom payments using the Braintree platform via `cordova-plugin-purchase` v13+ and its **required Braintree extension**.

{% hint style="warning" icon="warning" %}
**Platform Interfaces Change Frequently!**

The Braintree control panel interface, SDKs, and requirements change often. This guide provides a general overview but may become outdated.

**Always refer to the official Braintree documentation as the primary source:**
*   [Braintree Get Started](https://developer.paypal.com/braintree/docs/start/overview)
*   [Client SDK Setup (iOS)](https://developer.paypal.com/braintree/docs/guides/client-sdk/setup/ios/v6)
*   [Client SDK Setup (Android)](https://developer.paypal.com/braintree/docs/guides/client-sdk/setup/android/v6)
*   [Tokenization Keys & Client Tokens](https://developer.paypal.com/braintree/docs/guides/authorization)
*   [Drop-in UI Guide](https://developer.paypal.com/braintree/docs/guides/drop-in/overview)
{% endhint %}

### 1. Braintree Account Setup

*   **Sandbox:** Sign up for a [Braintree Sandbox account](https://www.braintreepayments.com/sandbox) for development and testing. This provides test API keys and a simulated environment.
*   **Production:** When ready to accept real payments, apply for a [Braintree Production account](https://www.braintreepayments.com/signup) and complete the underwriting process.

### 2. Retrieve Braintree API Credentials

Log in to your Braintree Control Panel (Sandbox or Production):

*   Navigate to **Settings** (gear icon) -> **API**.
*   Note down your:
    *   **Merchant ID**
    *   **Public Key**
    *   **Private Key** (Keep this secure! It's used server-side).
*   You will also find your **Tokenization Key** here. This key can be used directly in the client-side SDK for basic authorization, primarily suitable for testing or simple integrations. **Using Client Tokens generated server-side is recommended for production.**

### 3. Install Dependencies

Install the core purchase plugin **AND** the Braintree extension plugin.

```bash
# Install the core plugin
cordova plugin add cordova-plugin-purchase

# Install the Braintree extension
cordova plugin add cordova-plugin-purchase-braintree
```

Also ensure you have base Cordova/Node development tools installed:

Needless to say, make sure you have the tools installed on your machine. During the writing of this guide, I've been using the following environment:

* **NodeJS** v10.12.0
* **Cordova** v8.1.2
* **macOS** 10.14.1

I'm not saying it won't work with different version. If you start fresh, it might be a good idea to use an up-to-date environment.


### 4. Create or Prepare Cordova Project

Set up your Cordova project and add the required platforms (iOS and/or Android).

*   **Create Project:**
    !INCLUDE "./create-cordova-project.md"
*   **Add Platforms:**
    ```bash
    cordova platform add ios
    cordova platform add android
    ```

### 5. Configure Android Project (Gradle/Dependencies)

The `cordova-plugin-purchase-braintree` extension uses Gradle to manage the native Braintree Android SDK dependencies.

*   Run `cordova prepare android`.
*   Ensure your project builds successfully (`cordova build android`). Gradle should automatically download the required Braintree libraries.
*   Check the plugin's `plugin.xml` for specific Android SDK version requirements if you encounter build issues related to dependencies.

### 6. Configure iOS Project (Cocoapods)

The Braintree extension uses Cocoapods for iOS dependencies.

*   **Install Cocoapods:** If you don't have it, run `sudo gem install cocoapods`.
*   **Navigate and Install:** After adding the iOS platform and the plugin, go to your project's `platforms/ios/` directory in the terminal and run:
    ```bash
    pod install --repo-update
    ```
*   **Open Workspace:** Always open the `.xcworkspace` file in Xcode, **not** the `.xcodeproj` file, after running `pod install`.
    ```bash
    open platforms/ios/*.xcworkspace
    ```
*   **Build:** Build the project in Xcode to ensure dependencies are linked correctly.

### 7. Initialize Braintree in Your App

In your application's JavaScript (after `deviceready`), you need to initialize the `CdvPurchase.store` including the Braintree platform adapter. This requires providing authorization.

**Option 1: Using Client Token Provider (Recommended for Production)**

This is the most secure method. Your server generates a short-lived Client Token using the Braintree Server SDK (with your Merchant ID, Public Key, and Private Key). Your app requests this token when needed.

```javascript
// In your initialization function (e.g., initializeStoreAndSetupListeners)
const { store, Platform, ErrorCode } = CdvPurchase;

const braintreeOptions = {
  clientTokenProvider: (callback) => {
    console.log('Requesting Braintree Client Token from server...');
    // Replace with your actual fetch call to your backend endpoint
    fetch('https://your-server.com/api/braintree/client-token', {
        method: 'POST',
        // Include authentication if needed: headers: { 'Authorization': 'Bearer ...' }
    })
    .then(response => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
    .then(data => {
        if (data.clientToken) {
            console.log('Client Token received.');
            callback(data.clientToken); // Provide the token to the plugin
        } else {
            console.error('Server did not provide clientToken:', data);
            const err = { code: ErrorCode.COMMUNICATION, message: 'Failed to fetch Braintree client token from server.', isError: true, platform: Platform.BRAINTREE, productId: null };
            callback(err);
        }
    })
    .catch(error => {
        console.error('Error fetching Braintree client token:', error);
        const err = { code: ErrorCode.COMMUNICATION, message: 'Network error fetching Braintree client token: ' + error.message, isError: true, platform: Platform.BRAINTREE, productId: null };
        callback(err);
    });
  }
  // Add other options like googlePay, applePay, threeDSecure here if needed
};

store.initialize([{
  platform: Platform.BRAINTREE,
  options: braintreeOptions
}])
.then(/* ... */);
```
*   **Note:** You must implement the `/api/braintree/client-token` endpoint on your server using Braintree's server SDKs.

**Option 2: Using Tokenization Key (Simpler for Testing)**

Use your **Sandbox** Tokenization Key directly. **Do not** use this method with your Production Tokenization Key in a publicly distributed app, as it's less secure than Client Tokens.

```javascript
// In your initialization function
const { store, Platform } = CdvPurchase;

const braintreeOptions = {
  tokenizationKey: "YOUR_SANDBOX_TOKENIZATION_KEY" // Replace with your actual Sandbox key
  // Add other options like googlePay, applePay, threeDSecure here if needed
};

store.initialize([{
  platform: Platform.BRAINTREE,
  options: braintreeOptions
}])
.then(/* ... */);
```

### 8. (Optional) Configure Apple Pay (iOS Only)

To enable Apple Pay via Braintree:

1.  **Configure Apple Pay in Braintree:** Follow Braintree's guide to configure Apple Pay in your Braintree control panel (requires Apple Merchant ID setup).
2.  **Enable Apple Pay Capability:** In Xcode, under "Signing & Capabilities", add the "Apple Pay" capability and configure your Merchant ID.
3.  **Provide Options:** Add the `applePay` configuration within the `braintreeOptions` during `store.initialize`. At minimum, `companyName` is often needed.
    ```javascript
    const braintreeOptions = {
      clientTokenProvider: /* ... */,
      applePay: {
        companyName: 'Your Company Name',
        // Optional: Add paymentSummaryItems if needed, otherwise plugin uses PaymentRequest data
        // preparePaymentRequest: (paymentRequest) => { ... return customizedApplePayRequest; }
      }
    };
    ```

### 9. (Optional) Configure Google Pay (Android Only)

To enable Google Pay via Braintree:

1.  **Configure Google Pay in Braintree:** Follow Braintree's guide to enable Google Pay in your Braintree control panel (may require linking a Google Merchant ID).
2.  **Provide Options:** Add the `googlePay` configuration within the `braintreeOptions` during `store.initialize`.
    ```javascript
    const braintreeOptions = {
      clientTokenProvider: /* ... */,
      googlePay: {
        environment: 'TEST', // Or 'PRODUCTION'
        countryCode: 'US', // Your country code
        googleMerchantName: 'Your Company Name' // Optional: Displayed in Google Pay sheet
        // Optional: allowedPaymentMethods, etc.
      }
    };
    ```

### 10. (Optional) Configure 3D Secure

To add an extra layer of security for card payments:

1.  **Enable 3D Secure in Braintree:** Ensure 3D Secure is enabled for your Braintree account.
2.  **Provide Options:** Add the `threeDSecure` configuration within the `braintreeOptions`. You typically need to provide the amount and potentially billing/shipping details within the `store.requestPayment` call itself, but you can set defaults here.
    ```javascript
    const braintreeOptions = {
      clientTokenProvider: /* ... */,
      threeDSecure: {
        // amount is usually set dynamically in requestPayment
        // email, billingAddress can also be set in requestPayment
        versionRequested: CdvPurchase.Braintree.ThreeDSecure.Version.V2 // Request 3DS 2 if possible
        // exemptionRequested: true // If you want to request exemptions
      }
    };
    ```

---

After completing these steps, your Braintree account and application should be configured to process payments using the `cordova-plugin-purchase-braintree` extension and the `store.requestPayment()` method. Remember that the crucial step of processing the payment nonce **must happen on your server**.
