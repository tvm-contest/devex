#!/bin/sh

if [ "X$1" = "X" ] ; then
    echo "Usage: ./build.sh COMMAND"
    echo "  COMMAND is the name of the executable to create in the current dir"
    exit 2
fi

COMMAND=$1

cp -f ../../common/*.hpp .

if [ -f picosha2.h ]; then
    echo Error: you should rename picosha2.h to picosha2.hpp
    echo Only sources with .hpp and .cpp are supported
    exit 2
fi

CURDIR=$(pwd)
FILES=$(ls *.hpp *.cpp)
touch $FILES

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
  cd ..
fi

rm -f bin/cli/src/*.cpp
rm -f bin/cli/src/*.hpp

for file in $FILES; do
    ln -sf $CURDIR/$file bin/cli/src/$file
done

cd build
make cli || exit 2

cp -f bin/cli/cli $CURDIR/$COMMAND




