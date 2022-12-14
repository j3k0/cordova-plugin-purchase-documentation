#!/bin/bash

echo
echo "##############"
echo "# ./build.sh #"
echo "##############"
echo

if [ "x$1" == "x--help" ]; then
  echo "Usage: ./build.sh [--help]"
  echo
  echo "./build.sh will generate the files in ./use-cases"
  echo
  exit 0
fi

cd use-cases || exit 1
for platform in braintree googleplay appstore; do
  for type in payment consumable subscription non-consumable nr-subscription; do
    if test -e $type-$platform.src.md; then
      markdown-pp -o $type-$platform.md $type-$platform.src.md
    fi
  done
done

echo
echo "########"
echo "# done #"
echo "########"
echo
