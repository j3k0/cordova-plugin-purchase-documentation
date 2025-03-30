## Setup for iOS AppStore

{% hint style="warning" icon="warning" %}
**Platform Interfaces Change Frequently!**

The App Store Connect interface and Apple's requirements change often. This guide provides a general overview but may become outdated.

**Always refer to the official Apple documentation as the primary source:**
*   [App Store Connect Help](https://help.apple.com/app-store-connect/)
*   [In-App Purchase Configuration](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases)
*   [Setting Up StoreKit Testing in Xcode](https://developer.apple.com/documentation/storekit/setting_up_storekit_testing_in_xcode) (Recommended for local testing)
*   [Generating Keys (Shared Secret)](https://developer.apple.com/documentation/appstoreserverapi/creating_api_keys_to_use_with_the_app_store_server_api) (Needed for Receipt Validation)
{% endhint %}

This section covers the essential steps for setting up your iOS/macOS app for In-App Purchases with the Cordova plugin.

### 1. Install Dependencies


Needless to say, make sure you have the tools installed on your machine. During the writing of this guide, I've been using the following environment:

* **NodeJS** v10.12.0
* **Cordova** v8.1.2
* **macOS** 10.14.1

I'm not saying it won't work with different version. If you start fresh, it might be a good idea to use an up-to-date environment.


### 2. Create Cordova Project

#### Create the project

If it isn't already created:

```text
$ cordova create CordovaProject cc.fovea.purchase.demo PurchaseNC
Creating a new cordova project.
```

For details about what those parameters are:

```text
$ cordova help create
```

Note, feel free to pick a different project ID and name. Remember whatever values you put in here.

Let's head into our cordova project's directory \(should match whatever we used in the previous step.

```text
$ cd CordovaProject
```
#### Add iOS platform

```text
$ cordova platform add ios
```


### 3. Setup AppStore Application & Agreements

*   **Apple Developer Account:** Ensure you have an active Apple Developer Program membership.
*   **App Record:** Create an App Record for your application in [App Store Connect](https://appstoreconnect.apple.com). You'll need a unique Bundle ID.
*   **Agreements, Tax, and Banking:** This is **critical**. Navigate to the "Agreements, Tax, and Banking" section in App Store Connect. Ensure all agreements, especially the "Paid Apps" agreement, are reviewed, accepted, and **Active**. Provide complete banking and tax information. Your app won't be able to process *any* purchases (even free trials or sandbox tests) if this section isn't fully set up and active.
*   **Bundle ID:** Go to "App Information" for your app record. Verify the Bundle ID listed exactly matches the `id` attribute in your project's `config.xml` widget tag (`<widget id="com.yourcompany.yourapp" ...>`).


First, I assume you have an Apple developer account. If not time to register, because it's mandatory.

Let's now head to the [AppStore Connect](https://appstoreconnect.apple.com) website. In order to start developing and testing In-App Purchases, you need all contracts in place as well as your financial information setup. Make sure there are no warning left there.

I'll not guide you through the whole procedure, just create setup your Apple application as usual.

#### Retrieve the Shared Secret

Since you are here, let's retrieve the Shared Secret. You can use an App-Specific one or a Master Shared Secret, at your convenience: both will work. Keep the value around, it'll be required, especially if you are implementing subscriptions.

![](../.gitbook/assets/appstore-shared-secret.png)




### 4. Install Plugin and Configure Xcode Project

Install the plugin:
```bash
cordova plugin add cordova-plugin-purchase
```

Then, configure your Xcode project:

1.  Prepare the Cordova iOS platform:
    ```bash
    cordova prepare ios
    ```
2.  Open your project in Xcode (use the `.xcworkspace` file if it exists, otherwise the `.xcodeproj`):
    ```bash
    open platforms/ios/*.xcworkspace  # or .xcodeproj if no workspace
    ```
3.  Select your project target in the Project Navigator (the left sidebar).
4.  Go to the **"Signing & Capabilities"** tab.
5.  Ensure a valid "Team" is selected and signing (Development or Distribution) is configured.
6.  Click **"+ Capability"** near the top.
7.  Search for and add **"In-App Purchase"**. It should appear in the capabilities list.

    !INCLUDE "../images/xcode-capability-in-app-purchase.md"


When you only require iOS support, no need for special command line arguments:

```text
$ cordova plugin add cordova-plugin-purchase
```

You then have to activate the In-App Purchase capability manually for your application using Xcode. Unfortunately it's not something the plugin can do automatically. So let's first prepare the iOS project:

```text
$ cordova prepare ios
```

Then open the project on Xcode:

```text
$ open platforms/ios/*.xcodeproj
```

Get to the project's settings by clicking on the project's icon, which is the top-most item in the left-side pane tree view.

Select the target, go to _Capabilities_, scroll down to _In-App Purchase_ and make sure it's **"ON".**

![Enabling In-App Purchase Capability in Xcode](../.gitbook/assets/xcode-iap-capability.png)

Now try to **build the app from Xcode**. It might point you to a few stuff it might automatically fix for you if you're starting from a fresh project, like selecting a development team and creating the signing certificate. So just let Xcode do that for you except if you have a good reason not to and know what you're doing.

Successful build? You're good to go!

*Note: The included section primarily repeats the capability step, ensure it's consistent.*

### 5. Create In-App Products in App Store Connect

You need to define each virtual item you want to sell within App Store Connect.

### 5. Create In-App Products

If you followed the [Setup AppStore Application](#3-setup-appstore-application) section, you should have everything setup. Head again to the App's In-App Purchases page: select your application, then _Features_, then _In-App Purchases_.

From there you can create your In-App Products. Select the appropriate type, fill in all required metadata and select _cleared for sale_.

{% hint style="warning" %}
Even if that sounds stupid, you need to fill-in ALL metadata in order to use the In-App Product in development, even the screenshot for reviewers. Make sure you have at least one localization in place too.
{% endhint %}

The process is well explained by Apple, so I'll not enter into more details.


### 6. Create Sandbox Test Users

Real purchases cost real money. For testing, you need **Sandbox Apple IDs**.

### 6. Create Test Users

In order to test your In-App Purchases during development, you should create some test users.

You can do so from the AppStore Connect website, in the _Users & Access_ section. There in the sidebar, you should see "Sandbox > Testers". If you don't, it means you don't have enough permissions to create sandbox testers, so ask your administrator.

From there, it's just a matter of hitting "+" and filling the form. While you're at it, create 2-3 test users: it will be handy for testing.

![](../.gitbook/assets/appstore-test-users.png)


### 7. (Recommended) Setup Receipt Validation Service

Server-side validation is essential for security and reliable subscription management.

