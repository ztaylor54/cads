#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Invalid parameters. Usage: ./split_photos.sh path/to/photos file_extension"
    exit 1
fi

DIRECTORY=$1
EXTENSION=$2
OBV=$DIRECTORY/obverse
REV=$DIRECTORY/reverse

mkdir -p $OBV
mkdir -p $REV

for filename in $DIRECTORY*.$EXTENSION; do
    # Converts image into two equal halves
    convert $filename -crop 2x1@ +repage ${filename%.*}-%01d.$EXTENSION
    mv ${filename%.*}-0.$EXTENSION $OBV/$(basename ${filename%.*}_obv.$EXTENSION)
    mv ${filename%.*}-1.$EXTENSION $REV/$(basename ${filename%.*}_rev.$EXTENSION)
done
