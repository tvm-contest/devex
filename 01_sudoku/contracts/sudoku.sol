// contract initially copied from
// https://github.com/NilFoundation/ton-proof-verification-contest
// at examples/lscs/solidity/PrimaryInputVerificationExample.sol
pragma ton-solidity >=0.30.0;

contract ZKSudoku {

    uint8 constant MUST_BE_OWNER = 100;
    uint8 constant WRONG_SIZE = 101;
    uint8 constant SUDOKU_FORBIDDEN_VALUE = 102;

    uint8 constant SUDOKU_SIZE = 4;
    uint8 constant NUM_SQUARES = SUDOKU_SIZE * SUDOKU_SIZE;
    uint8 constant PROOF_SIZE = 192;
    uint32 constant PI_SIZE = NUM_SQUARES;
    uint8 constant field_element_bytes = 32;
    address m_owner; // address of the contract supplying new sudoku
		     // instances? Or just the owner manually sending
		     // them? First option makes it more turnkey

    struct fixed_value {
	uint8 i;
	uint8 j;
	uint8 value;
    }

    fixed_value[] m_instance; //the array of fixed instances

    // check that fixed values are legal
    function check_value(fixed_value v)
	private pure returns (bool) {
	require(v.i < SUDOKU_SIZE &&
		v.j < SUDOKU_SIZE, WRONG_SIZE);
	require(v.value <= SUDOKU_SIZE, SUDOKU_FORBIDDEN_VALUE);
	return true;
    }

    constructor(address owner, fixed_value[] instance) public {
	tvm.accept();
	m_owner = owner;
	for(uint i=0;i<instance.length;i++){
	    require(check_value(instance[i]));
	    m_instance.push(instance[i]);
	}
    }

    // getter for debugging
    function get_value(uint i) public view returns (fixed_value){
	return m_instance[i];
    }


    // lots of for loops but at least none of this is stored in the
    // contract's memory
    function pi_from_instance(fixed_value[] instance)
	public pure returns (bytes) {
	uint8[] temp;
	// initialize all values to zero
	for(uint i=0;i<NUM_SQUARES;i++){
	    temp.push(0);
	}
	// input the fixed values from instance
	for(uint i=0;i<instance.length;i++){
	    fixed_value fv = instance[i];
	    require(check_value(fv));
	    temp[fv.i * SUDOKU_SIZE + fv.j] = fv.value;
	}
	string blob_str = "";
	// build the actual encoded primary input
	for(uint i=0;i<NUM_SQUARES;i++){
	    blob_str.append(serialize_primary_input(temp[i]));
	}
	return blob_str;

    }


    function submit(bytes v_key, // should not be here if we could
				 // serialize properly using the nil
				 // library
		    bytes proof)
	public view returns (bool res) {
	    require(proof.length == PROOF_SIZE);
	    tvm.accept();
	    string blob_str = proof;
	    blob_str.append(pi_from_instance(m_instance));
	    blob_str.append(v_key);
	    if(tvm.vergrth16(blob_str)){
		res = true;
	    }
	    else{
		res = false;
	}
    }

    function serialize_primary_input(uint32 some_number) pure internal inline returns(bytes) {
        string blob_str=(encode_little_endian(PI_SIZE,4));
        blob_str.append(encode_little_endian(uint256(some_number), field_element_bytes));
        return blob_str;
    }

    function encode_little_endian(uint256 number, uint32 bytes_size) internal pure returns (bytes){
        TvmBuilder ref_builder;
        for(uint32 i=0; i<bytes_size; ++i) {
            ref_builder.store(byte(uint8(number & 0xFF)));
            number>>=8;
        }
        TvmBuilder builder;
        builder.storeRef(ref_builder.toCell());
        return builder.toSlice().decode(bytes);
    }

}
