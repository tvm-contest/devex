pragma ton-solidity >= 0.40;

// code by Noam Y

abstract contract Blueprint {

  uint8 constant PROOF_SIZE = 192;
  uint8 constant field_element_bytes = 32;

  function serialize_primary_input( uint32 some_number )
    pure internal inline returns(bytes) {
    string blob_str =
      encode_little_endian(uint256(some_number), field_element_bytes);
    return blob_str;
  }

  function encode_little_endian(uint256 number, uint32 bytes_size)
    pure internal returns (bytes){
    TvmBuilder ref_builder;
    for(uint32 i=0; i<bytes_size; ++i) {
      ref_builder.store(byte(uint8(number & 0xFF)));
      number>>=8;
    }
    TvmBuilder builder;
    builder.storeRef(ref_builder.toCell());
    return builder.toSlice().decode(bytes);
  }

  function uint256_to_bytes(uint256 number) internal pure returns (bytes){
    TvmBuilder ref_builder;
    ref_builder.store(bytes32(number));
    TvmBuilder builder;
    builder.storeRef(ref_builder.toCell());
    return builder.toSlice().decode(bytes);
  }
}
