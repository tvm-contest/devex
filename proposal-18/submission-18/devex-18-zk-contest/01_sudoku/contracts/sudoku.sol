/*
Implementation of contract Sudoku
 */

pragma ton-solidity >=0.30.0;

contract ZKSudoku {

    // Error codes
    uint8 constant MUST_BE_OWNER = 100;
    uint8 constant WRONG_SIZE = 101;
    uint8 constant SUDOKU_FORBIDDEN_VALUE = 102;

    // Sudoku parameters to keep generality when switching to 9x9 or
    // larger
    uint8 constant SUDOKU_SIZE = 4;
    uint8 constant NUM_SQUARES = SUDOKU_SIZE * SUDOKU_SIZE;

    uint8 constant PROOF_SIZE = 192;
    // Size of Primary input
    uint32 constant PI_SIZE = NUM_SQUARES;
    uint8 constant field_element_bytes = 32;
    uint256 m_owner; // address of the owner manually sending new
		     // instances
    bytes v_key; // the verification key

    //    bytes g_zip_provkey; // the proving key, compressed with
    //    gzip This was not included in the end because the proving
    //    key is 64 kbytes.

    uint8[][3] m_instance; //the array of fixed instances

    /// @dev getter of the current state of the contract
    function get() public view returns
	(
	 uint8 num_squares,
	 uint8[][3] current_instance,
	 bytes verifkey
	 )
    {
	num_squares = NUM_SQUARES;
	current_instance = m_instance;
	verifkey = v_key;
    }
    /// @dev checks that a fixed value is legal
    ///   (between 0 and SUDOKU_SIZE)
    /// @param i: row index of checked value
    /// @param j: column index of checked value
    /// @param value: actual checked value
    function check_value(uint8 i,uint8 j,uint8 value)
	private pure returns (bool) {
	if(i < SUDOKU_SIZE &&
	   j < SUDOKU_SIZE){
	    if(value <= SUDOKU_SIZE)
		return true;
	    else
		require(false, SUDOKU_FORBIDDEN_VALUE);}
	else
	    require(false, WRONG_SIZE);}

    /// @dev submits a new instance (i.e. Sudoku problem) and replaces
    ///   m_instance with it. Only called by the owner.

    /// @param instance: the Sudoku problem encoded as an array [
    ///   [i,j,value] ] for every square i,j which is fixed by the
    ///   submitter
    function submit_instance(uint8[][3] instance) public returns (bool res) {

	require(msg.pubkey() == m_owner, MUST_BE_OWNER);
	tvm.accept();
	delete m_instance;
	for(uint i=0;i<instance.length;i++){
	    if(check_value(instance[i][0],instance[i][1],instance[i][2]))
		m_instance.push(instance[i]);
	    else
		require(false,SUDOKU_FORBIDDEN_VALUE);
	}
	res = true;
    }

    /// @dev constructor: Takes a verification key and an instance
    /// (i.e. Sudoku problem)
    /// @param v_key_in: the verification key corresponding to the
    ///   circuit
    /// @param instance: the Sudoku problem encoded as an array [
    ///   [i,j,value] ] for every square i,j which is fixed by the
    ///   submitter
    constructor(bytes v_key_in, uint8[][3] instance) public {
	tvm.accept();
	m_owner = msg.pubkey();
	v_key = v_key_in;
	for(uint8 i=0;i<instance.length;i++){
	    require(check_value(instance[i][0],instance[i][1],instance[i][2]));
	    m_instance.push(instance[i]);
	}
    }

    /// @dev computes the primary input with the right encoding for the
    ///  vergrth16 instruction from m_instance
    /// @param instance: the Sudoku problem encoded as an array [
    ///   [i,j,value] ] for every square i,j which is fixed by the
    ///   problem
    function pi_from_instance(uint8[][3] instance)
	public pure returns (bytes) {
	uint8[] temp;
	// initialize all values to zero
	for(uint i=0;i<NUM_SQUARES;i++){
	    temp.push(0);
	}
	// input the fixed values from instance
	for(uint k=0;k<instance.length;k++){
	    uint8 i=instance[k][0];
	    uint8 j=instance[k][1];
	    uint8 value=instance[k][2];
	    require(check_value(i,j,value));
	    temp[i * SUDOKU_SIZE + j] = value;
	}
	string blob_str=(encode_little_endian(PI_SIZE,4));
	// build the actual encoded primary input
	for(uint i=0;i<NUM_SQUARES;i++){
	    blob_str.append(serialize_primary_input(temp[i]));
	}
	return blob_str;

    }

    /// @dev submits the actual proof to be checked for the current
    /// instance and solution
    /// @param proof: The zero-knowledge proof for the current
    ///   instance and solution
    function submit(bytes proof)
	public view returns (bool res, string blob_str) {
	    require(proof.length == PROOF_SIZE);
	    tvm.accept();
	    blob_str = proof;
	    blob_str.append(pi_from_instance(m_instance));
	    blob_str.append(v_key);
	    if(tvm.vergrth16(blob_str)){
		res = true;
	    }
	    else{
		res = false;
	}
    }

    /// @dev serializes the primary input of the circuit into the
    ///   format expected by the vergrth16 instruction. Code from Noam
    ///   Y.
    /// @param some_number: the number to be encoded.
    function serialize_primary_input(uint32 some_number) pure internal inline returns(bytes) {
        string blob_str = encode_little_endian(uint256(some_number), field_element_bytes);
        return blob_str;
    }

    /// @dev encodes a number into little endian format on a given
    /// number of bytes
    /// @param number: the number to be encoded
/// @param bytes_size: the number of bytes on which to encode the
    /// number
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
