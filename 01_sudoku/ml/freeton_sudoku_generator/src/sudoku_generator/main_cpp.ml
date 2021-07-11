let big_fat_cpp
      ~name
      public_variable_definitions (*  blueprint_variable<field_type> out; *)
      ~allocate_public_variables
      ~public_variable_arguments
      ~sudoku_size
  =
Printf.sprintf
{|#include <stdlib.h>
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

#include "%s.hpp"

using namespace nil::crypto3::zk::snark;
using namespace nil::crypto3::algebra;

typedef algebra::curves::bls12<381> curve_type;
typedef typename curve_type::scalar_field_type field_type;

typedef zk::snark::r1cs_gg_ppzksnark<curve_type> scheme_type;

std::vector<int> read_input(std::string filename){
  std::vector<int> sudoku;
  std::ifstream inFile;
  inFile.open(filename.c_str());
  if (inFile.is_open())
    {
      for (int i = 0; i < %d; i++)
        {
	  char temp;
	  inFile >> temp;
	  sudoku.push_back((int)temp - (int)48); //convert char to int
	  std::cout << sudoku[i] << " ";
        }

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


int test(){

    using curve_type = curves::bls12<381>;
    using field_type = typename curve_type::scalar_field_type;

    // Create blueprint

    blueprint<field_type> bp;
    %s
    //blueprint_variable<field_type> out;
    //blueprint_variable<field_type> x;

    // Allocate variables
    %s
    //out.allocate(bp);
    //x.allocate(bp);

    // This sets up the blueprint variables
    // so that the first one (out) represents the public
    // input and the rest is private input

    bp.set_input_sizes(%d);

    // Initialize component

    test_component<field_type> g(bp%s);
    g.generate_r1cs_constraints();

    // Add witness values
/*    bp.val(x_0_0) = 1;
    bp.val(x_0_1) = 2;
    bp.val(x_0_2) = 3;
    bp.val(x_0_3) = 4;

    bp.val(x_1_0) = 3;
    bp.val(x_1_1) = 4;
    bp.val(x_1_2) = 2;
    bp.val(x_1_3) = 1;

    bp.val(x_2_0) = 2;
    bp.val(x_2_1) = 1;
    bp.val(x_2_2) = 4;
    bp.val(x_2_3) = 3;

    bp.val(x_3_0) = 4;
    bp.val(x_3_1) = 3;
    bp.val(x_3_2) = 1;
    bp.val(x_3_3) = 2;*/

    bp.val(free_x_0_0) = 0;
    bp.val(free_x_0_1) = 0;
    bp.val(free_x_0_2) = 0;
    bp.val(free_x_0_3) = 0;

    bp.val(free_x_1_0) = 0;
    bp.val(free_x_1_1) = 0;
    bp.val(free_x_1_2) = 0;
    bp.val(free_x_1_3) = 0;

    bp.val(free_x_2_0) = 0;
    bp.val(free_x_2_1) = 0;
    bp.val(free_x_2_2) = 0;
    bp.val(free_x_2_3) = 0;

    bp.val(free_x_3_0) = 0;
    bp.val(free_x_3_1) = 0;
    bp.val(free_x_3_2) = 0;
    bp.val(free_x_3_3) = 0;

/*    bp.val(free2_x_0_0) = 0;
    bp.val(free2_x_0_1) = 0;
    bp.val(free2_x_0_2) = 0;
    bp.val(free2_x_0_3) = 0;

    bp.val(free2_x_1_0) = 0;
    bp.val(free2_x_1_1) = 0;
    bp.val(free2_x_1_2) = 0;
    bp.val(free2_x_1_3) = 0;

    bp.val(free2_x_2_0) = 0;
    bp.val(free2_x_2_1) = 0;
    bp.val(free2_x_2_2) = 0;
    bp.val(free2_x_2_3) = 0;

    bp.val(free2_x_3_0) = 0;
    bp.val(free2_x_3_1) = 0;
    bp.val(free2_x_3_2) = 0;
    bp.val(free2_x_3_3) = 0;*/


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

    assert(bp.is_satisfied());*/

    const r1cs_constraint_system<field_type> constraint_system = bp.get_constraint_system();

    const typename r1cs_gg_ppzksnark<curve_type>::keypair_type keypair = generate<r1cs_gg_ppzksnark<curve_type>>(constraint_system);

    // prepare proving key for marshalling
    std::vector<std::uint8_t> proving_key_byteblob =
        nil::marshalling::verifier_input_serializer_tvm<scheme_type>::process(keypair.first);

    boost::filesystem::ofstream poutf1("sudoku_proving_key.bin");
    for (const auto &v : proving_key_byteblob) {
      poutf1 << v;
    }
    poutf1.close();

    // preparing verification key for marshalling
    std::vector<std::uint8_t> verification_key_byteblob =
      nil::marshalling::verifier_input_serializer_tvm<scheme_type>::process(keypair.second);

    boost::filesystem::ofstream poutf2("sudoku_verification_key.bin");
    for (const auto &v : verification_key_byteblob) {
      poutf2 << v;
    }
    poutf2.close();


    return 0;
}

inline std::vector<uint8_t> read_vector_from_disk(std::string file_path)
{
  std::ifstream instream(file_path, std::ios::in | std::ios::binary);
  std::vector<uint8_t> data((std::istreambuf_iterator<char>(instream)), std::istreambuf_iterator<char>());
  return data;
}


void prove(std::vector<int> sudoku_instance, std::vector<int> sudoku_solution){

  std::vector<uint8_t> proving_key_byteblob = read_vector_from_disk("sudoku_proving_key.bin");

  // this line is necessary but I don't understand it
  nil::marshalling::status_type provingProcessingStatus = nil::marshalling::status_type::success;

  typename scheme_type::proving_key_type proving_key =
    nil::marshalling::verifier_input_deserializer_tvm<scheme_type>::proving_key_process
    (
     proving_key_byteblob.cbegin(),
     proving_key_byteblob.cend(),
     provingProcessingStatus);


}


 |}
name
(sudoku_size * sudoku_size)
public_variable_definitions
allocate_public_variables
(sudoku_size * sudoku_size)
public_variable_arguments
