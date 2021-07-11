# devex-18-zk-contest

## Note: to compile ton-proof-verification-contest:

``` shell
cd ton-proof-verification-contest/cmake/modules/
mkdir build && cd build
cmake ..
(maybe sudo?) cmake --build . --target install
```

Then back in `ton-proof-verification-contest`,

``` shell
mkdir build
cd build
cmake ..
make cli
```
