---
description: >-
  Making sure we have a Cordova project that we can build for Android and/or
  iOS.
---

# 2. Create Cordova Project

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

