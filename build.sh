#!/bin/bash
for platform in android ios; do
  for type in consumable subscription non-consumable nr-subscription; do
    cat ./sections/setup-$platform-*.md ./sections/$type-$platform.md > guides/$type-$platform.md
  done
done
