#!/bin/bash

OPENCV_TARBALL_URL="https://github.com/opencv/opencv/archive/4.1.1.tar.gz"
OPENCV_TARBALL="4.1.1.tar.gz"
OPENCV_HOME="opencv"
BUILD_DIR=bin

echo "CADS | checking for opencv.js"
if [ ! -f "$BUILD_DIR/opencv.js" ]; then
    echo "CADS | installing build toolchain"

    # Check if emscripten has been installed, download it otherwise
    FILE=emsdk
    if [ ! -d "$FILE" ]; then
        echo "CADS | fetching emscripten"
        git clone https://github.com/emscripten-core/emsdk.git
        cd emsdk
        ./emsdk install latest
        ./emsdk activate latest
        echo "CADS | configuring binaryen"
        cd ..
    fi

    # Set up emsdk environment
    ./emsdk activate latest
    source emsdk/emsdk_env.sh --build=Release

    echo "CADS | finished installing and configuring build toolchain"

    echo "CADS | installing and configuing opencv"

    # Fetch opencv if not exists
    if [ ! -d "$OPENCV_HOME" ]; then
        echo "CADS | fetching opencv"
        wget $OPENCV_TARBALL_URL
        mkdir -p $OPENCV_HOME
        tar -xzf $OPENCV_TARBALL -C $OPENCV_HOME --strip-components=1
        rm $OPENCV_TARBALL
    fi

    # Build opencv.js
    # Specify --emscripten_dir because the $EMSCRIPTEN variable doesn't get set properly otherwise and CMake will fuss
    echo "CADS | building opencv.js"
    python $OPENCV_HOME/platforms/js/build_js.py $BUILD_DIR --build_wasm --emscripten_dir emsdk/fastcomp/emscripten --threads
fi
