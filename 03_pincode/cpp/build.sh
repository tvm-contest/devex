#!/bin/sh

if [ -f picosha2.h ]; then
    echo Error: you should rename picosha2.h to picosha2.hpp
    echo Only sources with .hpp and .cpp are supported
    exit 2
fi


CURDIR=$(pwd)
FILES=$(ls *.hpp *.cpp)

ROOTDIR=$(cd ../..; pwd)

cd $ROOTDIR
if [ ! -f ton-proof-verification-contest/CMakeLists.txt ]; then
    git clone --recursive https://github.com/NilFoundation/ton-proof-verification-contest.git
fi

cd ton-proof-verification-contest
if [ ! -f build/Makefile ]; then
  mkdir build
  cd build
  cmake ..
fi

for file in $FILES; do
    ln -sf $CURDIR/$file bin/cli/src/$file
done

cd build
make cli


