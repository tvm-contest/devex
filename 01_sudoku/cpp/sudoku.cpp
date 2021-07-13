#include <stdlib.h>
#include <iostream>

#include <nil/crypto3/zk/snark/blueprint.hpp>
#include <nil/crypto3/zk/snark/algorithms/generate.hpp>
#include <nil/crypto3/zk/snark/algorithms/verify.hpp>
#include <nil/crypto3/zk/snark/algorithms/prove.hpp>

#include <nil/crypto3/zk/snark/schemes/ppzksnark/r1cs_gg_ppzksnark.hpp>

#include <nil/crypto3/algebra/curves/bls12.hpp>
#include <nil/crypto3/algebra/fields/bls12/base_field.hpp>
#include <nil/crypto3/algebra/fields/bls12/scalar_field.hpp>
#include <nil/crypto3/algebra/fields/arithmetic_params/bls12.hpp>
#include <nil/crypto3/algebra/curves/params/multiexp/bls12.hpp>
#include <nil/crypto3/algebra/curves/params/wnaf/bls12.hpp>

#include <nil/crypto3/algebra/fields/detail/element/fp.hpp>
#include <nil/crypto3/algebra/fields/detail/element/fp2.hpp>

#include <nil/marshalling/status_type.hpp>

#include "sudoku.hpp"
#include <fstream>
#include "picosha2.hpp"

using namespace nil::crypto3::zk::snark;
using namespace nil::crypto3::algebra;

typedef algebra::curves::bls12<381> curve_type;
typedef typename curve_type::scalar_field_type field_type;
typedef zk::snark::r1cs_gg_ppzksnark<curve_type> scheme_type;
using namespace std;

#include "utils.hpp"


// void append_to_byteblob( std::vector<std::uint8_t> &byteblob, std::vector<std::uint8_t> bytes)
// {
//   byteblob.insert (byteblob.end(), bytes.begin(), bytes.end());
// }

// void binfile_of_byteblob( std::string file,  std::vector<std::uint8_t> byteblob ){
//   boost::filesystem::ofstream poutf( file );
//   for (const auto &v : byteblob) {
//     poutf << v;
//   }
//   poutf.close();
// }

// void hexfile_of_byteblob( std::string file,  std::vector<std::uint8_t> byteblob ){
//   std::string hex_str = utils::bytes_to_hex_string(byteblob.begin(), byteblob.end());
//   boost::filesystem::ofstream poutf( file );
//   poutf << hex_str << std::endl;
//   poutf.close();
// }

std::vector<int> read_input(std::string filename){
  std::vector<int> sudoku;
  std::ifstream inFile;
  inFile.open(filename.c_str());
  if (inFile.is_open())
    {
      for (int i = 0; i < 16; i++)
        {
	  char temp;
	  inFile >> temp;
	  sudoku.push_back((int)temp - (int)48); //convert char to int
	  std::cout << sudoku[i] << " ";
        }
      std::cout << std::endl;

      inFile.close();
    }
    else { //Error message
      std::cerr << "Can't find input file " << filename << std::endl;
    }
    return sudoku;
}


std::vector<int> input_instance(std::string filename){
  std::vector<int> sudoku = read_input(filename);
  return sudoku;
}

std::vector<int> input_solved(std::string filename){
  std::vector<int> sudoku = read_input(filename);
  return sudoku;
}

blueprint<curves::bls12<381>::scalar_field_type> build_blueprint(bool with_instance, std::vector<int> sudoku_instance, std::vector<int> sudoku_solution){
    using curve_type = curves::bls12<381>;
    using field_type = typename curve_type::scalar_field_type;

    // Create blueprint

    blueprint<field_type> bp;
    //private (intermediary) variables

    blueprint_variable<field_type> free_x_0_0;
    blueprint_variable<field_type> free_x_0_1;
    blueprint_variable<field_type> free_x_0_2;
    blueprint_variable<field_type> free_x_0_3;
    blueprint_variable<field_type> free_x_1_0;
    blueprint_variable<field_type> free_x_1_1;
    blueprint_variable<field_type> free_x_1_2;
    blueprint_variable<field_type> free_x_1_3;
    blueprint_variable<field_type> free_x_2_0;
    blueprint_variable<field_type> free_x_2_1;
    blueprint_variable<field_type> free_x_2_2;
    blueprint_variable<field_type> free_x_2_3;
    blueprint_variable<field_type> free_x_3_0;
    blueprint_variable<field_type> free_x_3_1;
    blueprint_variable<field_type> free_x_3_2;
    blueprint_variable<field_type> free_x_3_3;

    blueprint_variable<field_type> x_0_0;
    blueprint_variable<field_type> x_0_1;
    blueprint_variable<field_type> x_0_2;
    blueprint_variable<field_type> x_0_3;
    blueprint_variable<field_type> x_1_0;
    blueprint_variable<field_type> x_1_1;
    blueprint_variable<field_type> x_1_2;
    blueprint_variable<field_type> x_1_3;
    blueprint_variable<field_type> x_2_0;
    blueprint_variable<field_type> x_2_1;
    blueprint_variable<field_type> x_2_2;
    blueprint_variable<field_type> x_2_3;
    blueprint_variable<field_type> x_3_0;
    blueprint_variable<field_type> x_3_1;
    blueprint_variable<field_type> x_3_2;
    blueprint_variable<field_type> x_3_3;

    //blueprint_variable<field_type> out;
    //blueprint_variable<field_type> x;

    // Allocate variables
    //allocate public variables to blueprint
    free_x_0_0.allocate(bp);
    free_x_0_1.allocate(bp);
    free_x_0_2.allocate(bp);
    free_x_0_3.allocate(bp);
    free_x_1_0.allocate(bp);
    free_x_1_1.allocate(bp);
    free_x_1_2.allocate(bp);
    free_x_1_3.allocate(bp);
    free_x_2_0.allocate(bp);
    free_x_2_1.allocate(bp);
    free_x_2_2.allocate(bp);
    free_x_2_3.allocate(bp);
    free_x_3_0.allocate(bp);
    free_x_3_1.allocate(bp);
    free_x_3_2.allocate(bp);
    free_x_3_3.allocate(bp);

    x_0_0.allocate(bp);
    x_0_1.allocate(bp);
    x_0_2.allocate(bp);
    x_0_3.allocate(bp);
    x_1_0.allocate(bp);
    x_1_1.allocate(bp);
    x_1_2.allocate(bp);
    x_1_3.allocate(bp);
    x_2_0.allocate(bp);
    x_2_1.allocate(bp);
    x_2_2.allocate(bp);
    x_2_3.allocate(bp);
    x_3_0.allocate(bp);
    x_3_1.allocate(bp);
    x_3_2.allocate(bp);
    x_3_3.allocate(bp);

    //out.allocate(bp);
    //x.allocate(bp);

    // This sets up the blueprint variables
    // so that the first one (out) represents the public
    // input and the rest is private input

    bp.set_input_sizes(16);

    // Initialize component

    test_component<field_type> g(bp,free_x_0_0,free_x_0_1,free_x_0_2,free_x_0_3,free_x_1_0,free_x_1_1,free_x_1_2,free_x_1_3,free_x_2_0,free_x_2_1,free_x_2_2,free_x_2_3,free_x_3_0,free_x_3_1,free_x_3_2,free_x_3_3,x_0_0,x_0_1,x_0_2,x_0_3,x_1_0,x_1_1,x_1_2,x_1_3,x_2_0,x_2_1,x_2_2,x_2_3,x_3_0,x_3_1,x_3_2,x_3_3);
    g.generate_r1cs_constraints();

    if(with_instance){
      std::vector<blueprint_variable<field_type>*> variables;
      std::vector<blueprint_variable<field_type>*> free_variables;
      variables.push_back(&x_0_0);
      variables.push_back(&x_0_1);
      variables.push_back(&x_0_2);
      variables.push_back(&x_0_3);
      variables.push_back(&x_1_0);
      variables.push_back(&x_1_1);
      variables.push_back(&x_1_2);
      variables.push_back(&x_1_3);
      variables.push_back(&x_2_0);
      variables.push_back(&x_2_1);
      variables.push_back(&x_2_2);
      variables.push_back(&x_2_3);
      variables.push_back(&x_3_0);
      variables.push_back(&x_3_1);
      variables.push_back(&x_3_2);
      variables.push_back(&x_3_3);

      free_variables.push_back(&free_x_0_0);
      free_variables.push_back(&free_x_0_1);
      free_variables.push_back(&free_x_0_2);
      free_variables.push_back(&free_x_0_3);
      free_variables.push_back(&free_x_1_0);
      free_variables.push_back(&free_x_1_1);
      free_variables.push_back(&free_x_1_2);
      free_variables.push_back(&free_x_1_3);
      free_variables.push_back(&free_x_2_0);
      free_variables.push_back(&free_x_2_1);
      free_variables.push_back(&free_x_2_2);
      free_variables.push_back(&free_x_2_3);
      free_variables.push_back(&free_x_3_0);
      free_variables.push_back(&free_x_3_1);
      free_variables.push_back(&free_x_3_2);
      free_variables.push_back(&free_x_3_3);

      assert(sudoku_instance.size() == 16);
      assert(sudoku_solution.size() == 16);
      for(int i=0;i<4;i++){
	for(int j=0;j<4;j++){
	  int index = i * 4 + j;
	  blueprint_variable<field_type> x_i_j = *variables[index];
	  blueprint_variable<field_type> free_x_i_j = *free_variables[index];
	  //	  bp.val(free2_x_i_j) = sudoku_instance[index] * sudoku_instance[index]; //set the square right whether it is 0 or not
	  if (sudoku_instance[index] != 0){
	    if (sudoku_solution[index] != sudoku_instance[index]){
	      std::cout << "Solution invalid: value at indices "
			<< i << " and " << j
			<< " does not match given instance" << std::endl;;
	      assert(false);
	    }
	    else
	      {
		std::cout << "Solution valid: value at indices "
			<< i << " and " << j
			  << " is " << sudoku_instance[index] << std::endl;;
		bp.val(free_x_i_j) = sudoku_instance[index];
		bp.val(x_i_j) = sudoku_solution[index];
	      }
	  }
	  else{//this is not a fixed value square
	    bp.val(free_x_i_j) = 0;
	    bp.val(x_i_j) = sudoku_solution[index];
	  }
	}
      }
    }

    // Add witness values


    //bp.val(out) = 35;
    //bp.val(x) = 3;

    g.generate_r1cs_witness();

    std::cout << "primary input size" << bp.primary_input().size()<< std::endl;;
    std::cout << "auxiliary input size" << bp.auxiliary_input().size()<< std::endl;;
    std::cout << "num_inputs" << bp.num_inputs()<< std::endl;;
    std::cout << "num_variables" << bp.num_variables() << std::endl;;
    /*std::cout << "coucou2" << std::endl;
    r1cs_variable_assignment<field_type> full_variable_assignment = bp.primary_input();
    std::cout << "coucou3" << std::endl;
    //std::cout << bp.auxiliary_input().begin() << std::endl;
    std::cout << "coucou4" << std::endl;
    r1cs_auxiliary_input<field_type> aux = bp.auxiliary_input();
    full_variable_assignment.insert(
    full_variable_assignment.end(), aux.begin(), aux.end());
    std::cout << "coucou4" << std::endl;
    const r1cs_constraint_system<field_type> constraints = bp.get_constraint_system();
    std::cout << "coucou5" << std::endl;
    for (std::size_t c = 0; c < constraints.num_constraints(); ++c) {
        field_type::value_type ares =
        constraints.constraints[c].a.evaluate(full_variable_assignment);
        field_type::value_type bres =
        constraints.constraints[c].b.evaluate(full_variable_assignment);
        field_type::value_type cres =
        constraints.constraints[c].c.evaluate(full_variable_assignment);

        if(ares * bres == cres){
            std::cout << "equal" << std::endl;
        }
        if(!(ares * bres == cres)){
            std::cout << "not equal" << std::endl;
        }
     }
*/
    //assert(bp.is_satisfied());
    return bp;
}

int generate_keys(std::string proving_key_output_filename,std::string verification_key_output_filename){

  using curve_type = curves::bls12<381>;
  using field_type = typename curve_type::scalar_field_type;

  std::vector<int> empty_instance;
  blueprint<field_type> bp = build_blueprint(false,empty_instance,empty_instance);

  const r1cs_constraint_system<field_type> constraint_system = bp.get_constraint_system();

  const typename r1cs_gg_ppzksnark<curve_type>::keypair_type keypair = generate<r1cs_gg_ppzksnark<curve_type>>(constraint_system);

    // prepare proving key for marshalling
  std::vector<std::uint8_t> proving_key_byteblob =
    nil::marshalling::verifier_input_serializer_tvm<scheme_type>::process(keypair.first);

  boost::filesystem::ofstream poutf1(proving_key_output_filename);
  for (const auto &v : proving_key_byteblob) {
    poutf1 << v;
  }
  poutf1.close();

  // preparing verification key for marshalling
  std::vector<std::uint8_t> verification_key_byteblob =
    nil::marshalling::verifier_input_serializer_tvm<scheme_type>::process(keypair.second);

  boost::filesystem::ofstream poutf2(verification_key_output_filename);
  for (const auto &v : verification_key_byteblob) {
    poutf2 << v;
  }
  poutf2.close();


  return 0;
}

// inline std::vector<uint8_t> read_vector_from_disk(std::string file_path)
// {
//   std::ifstream instream(file_path, std::ios::in | std::ios::binary);
//   std::vector<uint8_t> data((std::istreambuf_iterator<char>(instream)), std::istreambuf_iterator<char>());
//   return data;
// }

typename scheme_type::proving_key_type fetch_proving_key(){
  std::vector<uint8_t> proving_key_byteblob = read_vector_from_disk("sudoku_proving_key.bin");

  // this line is necessary but I don't understand it (I guess it's a
  // default value?)
  nil::marshalling::status_type provingProcessingStatus = nil::marshalling::status_type::success;

  typename scheme_type::proving_key_type proving_key =
    nil::marshalling::verifier_input_deserializer_tvm<scheme_type>::proving_key_process
    (
     proving_key_byteblob.cbegin(),
     proving_key_byteblob.cend(),
     provingProcessingStatus);

  return proving_key;
}

typename scheme_type::verification_key_type fetch_verification_key(){
  std::vector<uint8_t> verification_key_byteblob = read_vector_from_disk("sudoku_verification_key.bin");

  // this line is necessary but I don't understand it
  nil::marshalling::status_type processingStatus = nil::marshalling::status_type::success;

  typename scheme_type::verification_key_type verification_key =
    nil::marshalling::verifier_input_deserializer_tvm<scheme_type>::verification_key_process
    (
     verification_key_byteblob.cbegin(),
     verification_key_byteblob.cend(),
     processingStatus);

  return verification_key;
}



void prove(std::vector<int> sudoku_instance, std::vector<int> sudoku_solution){

  typename scheme_type::proving_key_type proving_key =
    fetch_proving_key();
  typename scheme_type::verification_key_type verification_key =
    fetch_verification_key();

  using curve_type = curves::bls12<381>;
  using field_type = typename curve_type::scalar_field_type;

  blueprint<field_type> bp = build_blueprint(true, sudoku_instance, sudoku_solution);

  r1cs_variable_assignment<field_type> full_variable_assignment = bp.primary_input();



  std::cout << "coucou3" << std::endl;
  //std::cout << bp.auxiliary_input().begin() << std::endl;
  std::cout << "coucou4" << std::endl;
  r1cs_auxiliary_input<field_type> aux = bp.auxiliary_input();
  full_variable_assignment.insert(
				  full_variable_assignment.end(),
				  aux.begin(),
				  aux.end());
  std::cout << "coucou4" << std::endl;
  const r1cs_constraint_system<field_type> constraints = bp.get_constraint_system();
  std::cout << "coucou5" << std::endl;
  for (std::size_t c = 0; c < constraints.num_constraints(); ++c) {
    field_type::value_type ares =
      constraints.constraints[c].a.evaluate(full_variable_assignment);
    field_type::value_type bres =
      constraints.constraints[c].b.evaluate(full_variable_assignment);
    field_type::value_type cres =
      constraints.constraints[c].c.evaluate(full_variable_assignment);

    if(ares * bres == cres){
      std::cout << "equal" << std::endl;
    }
    if(!(ares * bres == cres)){
      std::cout << "not equal" << std::endl;
    }
  }

  const r1cs_constraint_system<field_type> constraint_system = bp.get_constraint_system();

   const typename r1cs_gg_ppzksnark<curve_type>::proof_type proof = prove<r1cs_gg_ppzksnark<curve_type>>(proving_key, bp.primary_input(), bp.auxiliary_input());

    bool verified = verify<r1cs_gg_ppzksnark<curve_type>>(verification_key, bp.primary_input(), proof);

      std::vector<std::uint8_t> verification_key_byteblob = nil::marshalling::verifier_input_serializer_tvm<scheme_type>::process(verification_key);
  std::vector<std::uint8_t> primary_input_byteblob = nil::marshalling::verifier_input_serializer_tvm<scheme_type>::process(bp.primary_input());
  std::vector<std::uint8_t> proof_byteblob = nil::marshalling::verifier_input_serializer_tvm<scheme_type>::process(proof);

  {
    std::vector<std::uint8_t> byteblob;

    append_to_byteblob( byteblob, proof_byteblob ) ;
    append_to_byteblob( byteblob, primary_input_byteblob ) ;
    append_to_byteblob( byteblob, verification_key_byteblob ) ;

    binfile_of_byteblob( "big_proof.bin", byteblob );
    hexfile_of_byteblob( "big_proof.hex", byteblob );
  }


    std::cout << "Number of R1CS constraints: " << constraint_system.num_constraints() << std::endl;
    std::cout << "Verification status: " << verified << std::endl;

    binfile_of_byteblob( "proof.bin", proof_byteblob );
    hexfile_of_byteblob( "proof.hex", proof_byteblob );

    return;

}
