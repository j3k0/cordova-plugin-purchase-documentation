#!/bin/bash

for platform in android ios; do
  for type in consumable subscription non-consumable nr-subscription; do
    (
      cat sections/$type-$platform-intro.md sections/generic-$platform-intro.md
      echo 
      echo '# Setup'
      echo
      cat ./sections/setup-$platform-*.md
      echo
      echo '# Coding'
      echo
      cat ./sections/$type-$platform.md
    ) > guides/$type-$platform.md
  done
done

# Setup Android
(
    echo "# Setup Android"
    echo
    echo "We will setup our Android application."
    echo
    cat ./sections/setup-android-*.md
) > guides/setup-android.md

# Setup iOS
(
    echo "# Setup iOS"
    echo
    echo "We will setup our iOS application."
    echo
    cat ./sections/setup-ios-*.md
) > guides/setup-ios.md
