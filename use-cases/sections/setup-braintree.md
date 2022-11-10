
### 1. Install Dependencies

!INCLUDE "./install-dependencies.md"

### 2. Create a Sandbox Braintree Account

Follow the instructions from Braintree to create a sandbox account. https://www.braintreepayments.com/sandbox

Markdown your API Credentials: Merchant ID, Public Key and Private Key.

### 3. Setup your Account on Iaptic

The Braintree implementation requires a server component that interacts with Braintree to create and settle transactions. Server side integration with the Braintree platform is outside the scope for this tutorial. We'll use [Iaptic](https://www.iaptic.com/)'s own integration that provides a simple platform neutral interface.

Go to [iaptic.com](https://www.iaptic.com/) to create an account (or login if you already have one). Fill in the Braintree section in iaptic's settings.

Also mark down your iaptic's **App Name** and **Public Key**.

### 4. Install the Braintree extension

Support for Braintree is added by installing an additional plugin with ID `cordova-plugin-purchase-braintree`.

For the most up-to-date information on how to install and setup the plugin, you can head to the [plugin's GitHub page](https://github.com/j3k0/cordova-plugin-purchase-braintree).

Let's install it:

    cordova plugin add cordova-plugin-purchase-braintree

For this guide, I'll use an android device. As mentioned in the plugin's documentation, we have to add this section to our application's `config.xml`.

```xml
<platform name="android">
    <preference name="android-minSdkVersion" value="21" />
</platform>
```
