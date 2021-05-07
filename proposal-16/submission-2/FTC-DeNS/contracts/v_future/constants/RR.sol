pragma ton-solidity ^0.38.0;

library RR {
    uint8 constant StartedAuction = 0;      // Auction was started, returning it's address
    uint8 constant CertificateAddress = 1;  // Name is already registered, returning address
    uint8 constant AuctionAddress = 2;      // There is ongoing auction with this address
}