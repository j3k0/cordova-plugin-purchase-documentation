## Setup for Braintree

{% hint style="warning" icon="warning" %}
**Platform Interfaces Change Frequently!**

The Braintree control panel interface and requirements change often. This guide provides a general overview but may become outdated.

**Always refer to the official Braintree documentation as the primary source:**
*   [Braintree Get Started](https://developer.paypal.com/braintree/docs/start/overview)
*   [Client SDK Setup (iOS)](https://developer.paypal.com/braintree/docs/guides/client-sdk/setup/ios/v6)
*   [Client SDK Setup (Android)](https://developer.paypal.com/braintree/docs/guides/client-sdk/setup/android/v6)
*   [Tokenization Keys & Client Tokens](https://developer.paypal.com/braintree/docs/guides/authorization)
{% endhint %}

This section covers the essential steps for setting up Braintree payments with the Cordova Purchase plugin. This requires the **`cordova-plugin-purchase-braintree`** extension plugin.

### 1. Braintree Account

*   Sign up for a [Braintree Sandbox account](https://www.braintreepayments.com/sandbox) for testing.
*   Once ready for production, apply for a [Production account](https://www.braintreepayments.com/signup).

### 2. Retrieve API Credentials

In your Braintree Control Panel (Sandbox or Production):
*   Navigate to "Settings" -> "API Keys".
*   You will need your **Merchant ID**, **Public Key**, and **Private Key** for server-side operations (like your receipt validator or backend).
*   For client-side initialization, you'll typically use a **Tokenization Key** (found in API Keys section) or generate **Client Tokens** on your server using the Merchant ID, Public Key, and Private Key. Client Tokens are more secure and recommended for production.

### 3. Install Dependencies

Install the core purchase plugin *and* the Braintree extension:
```bash
cordova plugin add cordova-plugin-purchase
cordova plugin add cordova-plugin-purchase-braintree
```

Also ensure you have base dependencies:
!INCLUDE "./install-dependencies.md"

### 4. Create Cordova Project

!INCLUDE "setup-braintree-4-create-cordova-project.md"

### 5. Configure Android Project

The `cordova-plugin-purchase-braintree` extension usually handles dependencies automatically via Gradle. Ensure your project syncs correctly. No specific `config.xml` entries are typically needed for basic Braintree setup.

### 6. Configure iOS Project

The `cordova-plugin-purchase-braintree` extension uses Cocoapods to manage iOS dependencies.

*   Ensure Cocoapods is installed (`sudo gem install cocoapods`).
*   After adding the plugin and the iOS platform, navigate to `platforms/ios/` and run `pod install`.
*   Open the `.xcworkspace` file (not `.xcodeproj`) in Xcode.

### 7. Initialize Braintree in your App

You need to initialize the Braintree platform adapter with either a Tokenization Key or a Client Token Provider.

**Using Tokenization Key (Simpler for testing, less secure):**

```javascript
const { store, Platform } = CdvPurchase;

store.initialize([
  {
    platform: Platform.BRAINTREE,
    options: {
      tokenizationKey: "YOUR_SANDBOX_TOKENIZATION_KEY" // Replace with your actual key
    }
  }
]);
```

**Using Client Token Provider (Recommended for Production):**

Your server needs an endpoint that generates a Client Token using the Braintree server SDK.

```javascript
// In your app's initialization code:
const { store, Platform } = CdvPurchase;
import { Braintree } from 'cordova-plugin-purchase/platforms/braintree'; // For types

const braintreeOptions: Braintree.AdapterOptions = {
  clientTokenProvider: (callback) => {
    // Make an AJAX request to your server endpoint
    // to fetch a fresh client token.
    fetch('https://your-server.com/api/braintree/client-token', {
        method: 'POST',
        // Include user auth if needed: headers: { 'Authorization': 'Bearer ...' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.clientToken) {
            callback(data.clientToken); // Provide the token to the plugin
        } else {
            callback({ // Report error if token fetching failed
                code: CdvPurchase.ErrorCode.COMMUNICATION,
                message: 'Failed to fetch Braintree client token',
                isError: true,
                platform: Platform.BRAINTREE,
                productId: null,
            });
        }
    })
    .catch(error => {
        callback({ // Report network/fetch error
            code: CdvPurchase.ErrorCode.COMMUNICATION,
            message: 'Error fetching Braintree client token: ' + error.message,
            isError: true,
            platform: Platform.BRAINTREE,
            productId: null,
        });
    });
  }
};

store.initialize([
  {
    platform: Platform.BRAINTREE,
    options: braintreeOptions
  }
]);

```

*(Server-side implementation for `/api/braintree/client-token` is required using Braintree's server SDKs)*.

### 8. (Optional) Enable Apple Pay

!INCLUDE "setup-braintree-8-apple-pay.md"

### 9. (Optional) Enable Google Pay

!INCLUDE "setup-braintree-9-google-pay.md"
