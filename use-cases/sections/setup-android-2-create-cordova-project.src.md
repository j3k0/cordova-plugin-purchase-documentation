
Making sure we have a Cordova project that we can build for Android and/or iOS.

#### Create the project

!INCLUDE "./create-cordova-project.md"

#### Add Android platform

```text
$ cordova platform add android
```

Will output:

```text
    Using cordova-fetch for cordova-android@~11.0.0
    Adding android project...
    [...]
    Saving android@~11.0.0 into config.xml file ...
```

Let's check if that builds.

```text
$ cordova build android
```

Which outputs:

```text
    Android Studio project detected
    Starting a Gradle Daemon (subsequent builds will be faster)
    [...]
    BUILD SUCCESSFUL in 1m 49s
    Built the following apk(s):
    __EDITED__/platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

Hopefully there's no problems with our Android build chain. If you do have problems, fixing it is out of scope from this guide but it's required!

