# 1. Install Dependencies

Needless to say, make sure you have the tools installed on your machine. Developing from a mac is generally recommended for doing iOS development, it's way easier. If you only plan on doing Android, then everything will work.

During the writing of this guide, I've been using the following environment:

* **NodeJS** v10.12.0
* **Cordova** v8.1.2
* **macOS** 10.14.1

I'm not saying it won't work with different version. If you start fresh, it might be a good idea to use an up-to-date environment.

# 2. Create Cordova Project

Making sure we have a Cordova project that we can build for Android and/or iOS.

### Create the project

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

### Add Android platform

```text
$ cordova platform add android
```

Will output:

```text
    Using cordova-fetch for cordova-android@~7.1.1
    Adding android project...
    Creating Cordova project for the Android platform:
                    Path: platforms/android
                    Package: cc.fovea.purchase.demo
                    Name: PurchaseNC
                    Activity: MainActivity
                    Android target: android-27
    Android project created with cordova-android@7.1.1
    Android Studio project detected
    Android Studio project detected
    Discovered plugin "cordova-plugin-whitelist" in config.xml. Adding it to the
  project
    Installing "cordova-plugin-whitelist" for android

    This plugin is only applicable for versions of cordova-android greater than
    4.0. If you have a previous platform version, you do *not* need this plugin
    since the whitelist will be built in.

    Adding cordova-plugin-whitelist to package.json
    Saved plugin info for "cordova-plugin-whitelist" to config.xml
    Saving android@~7.1.1 into config.xml file ...
```

Let's check if that builds.

```text
$ cordova build android
```

Which outputs:

```text
    Android Studio project detected
    ANDROID_HOME=__EDITED__
    JAVA_HOME=__EDITED__
    Starting a Gradle Daemon (subsequent builds will be faster)

    BUILD SUCCESSFUL in 4s
    1 actionable task: 1 executed
    Subproject Path: CordovaLib
    Subproject Path: app
    Starting a Gradle Daemon (subsequent builds will be faster)

    publishNonDefault is deprecated and has no effect anymore. All variants are
    now published.
    The Task.leftShift(Closure) method has been deprecated and is scheduled to
    be removed in Gradle 5.0. Please use Task.doLast(Action) instead.
at build_9eoufy0eczjepzj7e581szaej.run(__EDITED__/platforms/android/app/buil
d.gradle:143)
    :CordovaLib:preBuild UP-TO-DATE
    :CordovaLib:preDebugBuild UP-TO-DATE
    :CordovaLib:compileDebugAidl
    :CordovaLib:compileDebugRenderscript
    :CordovaLib:checkDebugManifest
    :CordovaLib:generateDebugBuildConfig
    :CordovaLib:prepareLintJar
    :CordovaLib:generateDebugResValues
    :CordovaLib:generateDebugResources
    :CordovaLib:packageDebugResources
    :CordovaLib:platformAttrExtractor
    :CordovaLib:processDebugManifest
    :CordovaLib:javaPreCompileDebug
    :CordovaLib:processDebugJavaRes NO-SOURCE
    :app:preBuild UP-TO-DATE
    :app:preDebugBuild
    :app:compileDebugAidl
    :CordovaLib:packageDebugRenderscript NO-SOURCE
    :app:compileDebugRenderscript
    :app:checkDebugManifest
    :app:generateDebugBuildConfig
    :app:prepareLintJar
    :app:generateDebugResValues
    :app:generateDebugResources
    :app:mergeDebugResources
    :app:createDebugCompatibleScreenManifests
    :app:processDebugManifest
    :app:splitsDiscoveryTaskDebug
    :app:compileDebugNdk NO-SOURCE
    :CordovaLib:mergeDebugShaders
    :CordovaLib:compileDebugShaders
    :CordovaLib:generateDebugAssets
    :CordovaLib:mergeDebugAssets
    :app:mergeDebugShaders
    :CordovaLib:processDebugResources
    :CordovaLib:generateDebugSources
    :CordovaLib:compileDebugJavaWithJavacNote: Some input files use or override
 a deprecated API.
    Note: Recompile with -Xlint:deprecation for details.

    :CordovaLib:transformClassesAndResourcesWithPrepareIntermediateJarsForDebug
    :app:processDebugResources
    :app:generateDebugSources
    :app:javaPreCompileDebug
    :app:compileDebugJavaWithJavac
    :app:compileDebugSources
    :app:compileDebugShaders
    :app:generateDebugAssets
    :app:mergeDebugAssets
    :app:transformClassesWithStackFramesFixerForDebug
    :app:transformClassesWithDesugarForDebug
    :app:transformClassesWithDexBuilderForDebug
    :app:transformDexArchiveWithExternalLibsDexMergerForDebug
    :app:transformDexArchiveWithDexMergerForDebug
    :CordovaLib:compileDebugNdk NO-SOURCE
    :CordovaLib:mergeDebugJniLibFolders
    :CordovaLib:transformNativeLibsWithMergeJniLibsForDebug
    :CordovaLib:transformNativeLibsWithStripDebugSymbolForDebug
    :CordovaLib:transformNativeLibsWithIntermediateJniLibsForDebug
    :app:mergeDebugJniLibFolders
    :app:transformNativeLibsWithMergeJniLibsForDebug
    :app:transformNativeLibsWithStripDebugSymbolForDebug
    :app:processDebugJavaRes NO-SOURCE
    :app:transformResourcesWithMergeJavaResForDebug
    :app:validateSigningDebug
    :app:packageDebug
    :app:assembleDebug
    :app:cdvBuildDebug

    BUILD SUCCESSFUL in 1m 49s
    48 actionable tasks: 48 executed
    Built the following apk(s):
    __EDITED__/platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

Alright, seems like we have no problems with our Android build chain. If you do have problems, fixing it is out of scope from this guide but it's required!

# 3. Create Google Play Application

Make sure we have a Google Play application created and configured.

## Create the App

* Open the [Google Play Console](https://play.google.com/apps/publish).
* Click "Create Application", fill in the required fields.

{% hint style="info" %}
Need more help? I recommend you check [Google's own documentation](https://support.google.com/googleplay/android-developer/answer/113469?hl=en&ref_topic=7072031). It's well detailed, easy to follow and probably the most up-to-date resource you can find.
{% endhint %}

## Retrieve the Billing Key

We need to inform the plugin of our app's `BILLING_KEY`. That piece of information can be found on the Google Play Publisher Console.

So head again to your [Google Play Console](https://play.google.com/apps/publish).

In the "_All Applications_" menu, go to the application you want to setup. In my case "_Cordova Purchase Demo_".

From there, find the "_Developments tools_" ⇒ "_Services & APIs_" section \(on the left-side panel\).

That is where you'll find this long Base64 string they call "**Your license key for this application**". Keep it around for later reference. That's your **Billing Key**.

{% hint style="info" %}
The Billing Key will be required to install the plugin on Android and setup receipt validation.
{% endhint %}

# 4. Install Cordova Purchase Plugin

To install the plugin, we will use the usual `cordova plugin add` command. But there are little subtleties on both [iOS](install-cordova-plugin.md#ios) and [Android](install-cordova-plugin.md#android).

## Android

If you need Android support, you need to setup your `BILLING_KEY`.

```text
cordova plugin add cc.fovea.cordova.purchase  --variable BILLING_KEY="<BILLING_KEY>"
```

You can find that piece of information on the Google Play Publisher Console, as [explained here](google-play.md#retrieve-the-billing-key).

Now let's try to build.

```text
cordova build android
```

Successful build?

```text
[...]
BUILD SUCCESSFUL in 2s
```

All good! Seems like we can build an app with support for the Billing API.

Let's now [Prepare a Release APK](android-release-apk.md).

# 5. Android Release APK

To generate a release build, I generally use the following script: [android-release.sh](https://gist.github.com/j3k0/28f60a7d5622508634d09f94c59d6dfc)

The script calls `cordova build android --release` with the correct command line arguments. It requires you have generated a `keystore` file for your application already.

If you haven't generated a keystore file for your application yet, you can use the following command line:

```text
keytool -genkey -v -keystore android-release.keystore -alias release \
-keyalg RSA -keysize 2048 -validity 10000
```

I'll ask you a few questions. The only tricky one is "Do you wan't to use the same password for the alias?", the answer is _yes_. Please note that the above command defines the keystore's `alias` as **release**, you can use any value, but just remember the value you chose.

Keep the `android-release.keystore` file in a safe place, backup it everywhere you can! Don't loose it, don't loose the password. You won't EVER be able to update your app on Google Play without it!

Then build.

```text
$ export KEYSTORE_ALIAS=release
$ export KEYSTORE_PASSWORD=my_password
$ ./android-release.sh
```

Replace `$KEYSTORE_ALIAS` and `$KEYSTORE_PASSWORD` with whatever match your those from your `keystore` file...

The output should end with a line like this:

```text
Build is ready:

<SOME_PATH>/android-release-20181015-1145.apk
```

There you go, this is your first release APK.

# 6. Create In-App Products

There is still a bit more preparatory work: we need to setup our in-app product.

Before creating your In-App Product, you have to [Create an Android Application](google-play.md) first. Done already? Let's now setup our in-app product.

Back in the "Google Play Console", open the "Store presence" ⇒ "In-app products" section.

![](../.gitbook/assets/google-play-in-app-products.png)

If you haven't yet uploaded an APK, it'll warn you that you need to upload a Release APK. Here's how you [Build a Release APK](android-release-apk.md) and [Upload it to Google Play](google-play.md#upload-a-release-build).

Once this is done, you can create a product. Google offers 2 kinds of products:

* Managed Products
* Subscriptions

The latest is for auto-renewing subscriptions, in all other cases, you have to create a "Managed Product".

* Click the **CREATE** button.
* Fill in all the required information \(title, description, prices\).
* Make sure the Status is **ACTIVE**.
* **SAVE**

At the time of this writing, the purchase plugin doesn't yet support Introductory Prices for Subscription \(you can check the [status of the feature here](https://github.com/j3k0/cordova-plugin-purchase/issues/743)\), so you have to leave this out for now.

And we're done!

{% hint style="info" %}
There's might be some delay between creating a product on the Google Play Console and seeing it in your app. If your product doesn't show up after 24h, then you should start to worry.
{% endhint %}

[What's next?](../index.md)

# 7. Upload to Google Play

## Upload a Release Build

Once you have [Built Your Release APK](android-release-apk.md), you need to upload it to Google Play in order to be able to test In-App Purchases. In-App Purchase is not enabled in "debug build". In order to test in-app purchase, your APK needs to be signed with your release signing key. In order for Google to know your release signing key for this application, you need to upload a release APK:

* Signed with this key.
* Have the BILLING permission enabled
  * which is done when you [add the plugin to your project](install-cordova-plugin.md), so make sure you didn't skip this step.

Google already provides [detailed resource on how to upload a release build](https://support.google.com/googleplay/android-developer/answer/7159011). What we want here is to:

1. create an **internal testing release**
2. **upload** it
3. **publish** it \(privately probably\).

Once you went over those steps, you can test your app with in-app purchase enabled without uploading to Google Play each time, but you need to sign the APK with the same "release" signing key.

{% hint style="warning" %}
Note that it might up to 24 hours for your IAP to work after you uploaded the first release APK.
{% endhint %}

