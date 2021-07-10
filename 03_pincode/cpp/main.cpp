//---------------------------------------------------------------------------//
// Copyright (c) 2018-2021 Mikhail Komarov <nemo@nil.foundation>
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//---------------------------------------------------------------------------//

#include <iostream>

#include <boost/filesystem.hpp>
#include <boost/program_options.hpp>

#include "detail/r1cs_examples.hpp"
#include "detail/sha256_component.hpp"

#include <nil/crypto3/algebra/curves/bls12.hpp>
#include <nil/crypto3/algebra/fields/bls12/base_field.hpp>
#include <nil/crypto3/algebra/fields/bls12/scalar_field.hpp>
#include <nil/crypto3/algebra/fields/arithmetic_params/bls12.hpp>
#include <nil/crypto3/algebra/curves/params/multiexp/bls12.hpp>
#include <nil/crypto3/algebra/curves/params/wnaf/bls12.hpp>

#include <nil/crypto3/zk/components/blueprint.hpp>
#include <nil/crypto3/zk/components/blueprint_variable.hpp>

#include <nil/crypto3/zk/snark/schemes/ppzksnark/r1cs_gg_ppzksnark.hpp>
#include <nil/crypto3/zk/snark/schemes/ppzksnark/r1cs_gg_ppzksnark/marshalling.hpp>

#include <nil/crypto3/zk/snark/algorithms/generate.hpp>
#include <nil/crypto3/zk/snark/algorithms/verify.hpp>
#include <nil/crypto3/zk/snark/algorithms/prove.hpp>

#include <nil/crypto3/zk/components/component.hpp>

#include <nil/crypto3/zk/components/blueprint.hpp>
#include <nil/crypto3/zk/components/blueprint_variable.hpp>
// #include <nil/crypto3/zk/snark/components/basic_components.hpp>

// #include <nil/crypto3/zk/snark/relations/constraint_satisfaction_problems/r1cs.hpp>

using namespace nil::crypto3;
using namespace nil::crypto3::zk;
using namespace nil::crypto3::zk::components;
using namespace nil::crypto3::algebra;

#include <iostream>
#include <string>
#include "picosha2.h"
using namespace std;

typedef algebra::curves::bls12<381> curve_type;
typedef typename curve_type::scalar_field_type field_type;

typedef zk::snark::r1cs_gg_ppzksnark<curve_type> scheme_type;

using std::string;
using std::cout;
using std::endl;



// This function translates a bytes[32] vector into a uint32[4]
// vector, by keeping only the first 16 bytes, and removing one bit to
// remain positive.  The result is only 124 bits long, but it's enough
// to keep finding collisions computationnaly impossible.
void uint32s_of_bytes( std::vector<uint32_t> &uints, std::vector<uint8_t> &bytes )
{
  for( int i = 0 ; i<4; i++ ){
    uints[i] =
      ( (uint32_t) bytes[ 4*i] ) +
      ( ( (uint32_t) bytes[ 4*i+1 ] ) << 8 ) +
      ( ( (uint32_t) bytes[ 4*i+2 ] ) << 16 ) + 
      ( ( (uint32_t) bytes[ 4*i+3 ] & 0x7f ) << 24 ) ;
  }
}


void append_to_byteblob( std::vector<std::uint8_t> &byteblob, std::vector<std::uint8_t> bytes)
{
  byteblob.insert (byteblob.end(), bytes.begin(), bytes.end());
}

void binfile_of_byteblob( std::string file,  std::vector<std::uint8_t> byteblob ){
  boost::filesystem::ofstream poutf( file );
  for (const auto &v : byteblob) {
    poutf << v;
  }
  poutf.close();
}

void hexfile_of_byteblob( std::string file,  std::vector<std::uint8_t> byteblob ){
  std::string hex_str = picosha2::bytes_to_hex_string(byteblob.begin(), byteblob.end());
  boost::filesystem::ofstream poutf( file );
  poutf << hex_str << endl;
  poutf.close();
}

void uint32s_of_passphrase( std::vector<uint32_t> &uints, std::string passphrase ){

  std::vector<uint8_t> hash(picosha2::k_digest_size);

  picosha2::hash256( passphrase.begin(), passphrase.end(), hash.begin(), hash.end());

  // for(int i = 0 ; i < 32; i++ ){
  //  cerr << " " << hash[ i ] ;
  // }
  // cerr << endl ;
  
  uint32s_of_bytes( uints, hash );
}

int int_of_hexchar(char input)
{
  if(input >= '0' && input <= '9')
    return input - '0';
  if(input >= 'A' && input <= 'F')
    return input - 'A' + 10;
  if(input >= 'a' && input <= 'f')
    return input - 'a' + 10;
  throw std::invalid_argument("Invalid input string");
}

void uint32s_of_pubkey( std::vector<uint32_t> &uints, std::string pubkey_s ){

  std::vector<uint8_t> pubkey(32);

  for( int i = 0 ; i < 32 ; i++ ){
    pubkey[ i ] = int_of_hexchar( pubkey_s[ i*2 ] ) * 16 + int_of_hexchar( pubkey_s[ i*2+1 ] ) ;
    // cerr << pubkey [ i ] << endl ;
  }
  uint32s_of_bytes( uints, pubkey );
}




using curve_type = curves::bls12<381>;
using field_type = typename curve_type::scalar_field_type;




void build_circuit ( blueprint<field_type> &bp, std::vector<uint32_t> &passphrase32 ){
  
  blueprint_variable<field_type> public_pubkey0;
  public_pubkey0.allocate( bp );

  blueprint_variable<field_type> public_pubkey1;
  public_pubkey1.allocate( bp );

  blueprint_variable<field_type> public_pubkey2;
  public_pubkey2.allocate( bp );

  blueprint_variable<field_type> public_pubkey3;
  public_pubkey3.allocate( bp );

  bp.set_input_sizes(4);

  blueprint_variable<field_type> secret_pubkey0;
  secret_pubkey0.allocate( bp );

  blueprint_variable<field_type> secret_pubkey1;
  secret_pubkey1.allocate( bp );

  blueprint_variable<field_type> secret_pubkey2;
  secret_pubkey2.allocate( bp );

  blueprint_variable<field_type> secret_pubkey3;
  secret_pubkey3.allocate( bp );

  blueprint_variable<field_type> secret_hash0;
  secret_hash0.allocate( bp );

  blueprint_variable<field_type> secret_hash1;
  secret_hash1.allocate( bp );

  blueprint_variable<field_type> secret_hash2;
  secret_hash2.allocate( bp );

  blueprint_variable<field_type> secret_hash3;
  secret_hash3.allocate( bp );

  // This sets up the blueprint variables
  // so that the first one (out) represents the public
  // input and the rest is private input


  bp.add_r1cs_constraint(r1cs_constraint<field_type>( secret_pubkey0 , 1, public_pubkey0));
  bp.add_r1cs_constraint(r1cs_constraint<field_type>( secret_pubkey1 , 1, public_pubkey1));
  bp.add_r1cs_constraint(r1cs_constraint<field_type>( secret_pubkey2 , 1, public_pubkey2));
  bp.add_r1cs_constraint(r1cs_constraint<field_type>( secret_pubkey3 , 1, public_pubkey3));
  bp.add_r1cs_constraint(r1cs_constraint<field_type>( passphrase32[0] , 1, secret_hash0));
  bp.add_r1cs_constraint(r1cs_constraint<field_type>( passphrase32[1] , 1, secret_hash1));
  bp.add_r1cs_constraint(r1cs_constraint<field_type>( passphrase32[2] , 1, secret_hash2));
  bp.add_r1cs_constraint(r1cs_constraint<field_type>( passphrase32[3] , 1, secret_hash3));
}





void prepare_circuit ( std::string passphrase ){

  using curve_type = curves::bls12<381>;
  using field_type = typename curve_type::scalar_field_type;

  // Create blueprint

  cerr << "(1)" << endl ;
  
  blueprint<field_type> bp;

  std::vector<uint32_t> passphrase32(4);
  uint32s_of_passphrase( passphrase32, passphrase );

  cerr << "(2)" << endl ;
  build_circuit( bp, passphrase32 );

  cerr << "(3)" << endl ;
  const r1cs_constraint_system<field_type> constraint_system = bp.get_constraint_system();
  const typename r1cs_gg_ppzksnark<curve_type>::keypair_type keypair = generate<r1cs_gg_ppzksnark<curve_type>>(constraint_system);

  cerr << "(4)" << endl ;

  std::vector<std::uint8_t> proving_key_byteblob = nil::marshalling::verifier_input_serializer_tvm<scheme_type>::process( keypair.first );
  binfile_of_byteblob( "provkey.bin", proving_key_byteblob );
  hexfile_of_byteblob( "provkey.hex", proving_key_byteblob );

  std::vector<std::uint8_t> verification_key_byteblob = nil::marshalling::verifier_input_serializer_tvm<scheme_type>::process( keypair.second );

  binfile_of_byteblob( "verifkey.bin", verification_key_byteblob );
  hexfile_of_byteblob( "verifkey.hex", verification_key_byteblob );

}

void use_circuit( std::string passphrase, std::string pubkey ){

  std::vector<uint32_t> passphrase32(4);
  std::vector<uint32_t> pubkey32(4);

  if( pubkey.size() != 64 ){
    cerr << "Wrong size for pubkey, should be 64 hexa chars" << endl ;
    exit(2) ;
  }

  cerr << "(1)" << endl ;  
  uint32s_of_passphrase( passphrase32, passphrase );
  
  cerr << "(2)" << endl ;
  uint32s_of_pubkey( pubkey32, pubkey );

  cerr << "(3)" << endl ;

  blueprint<field_type> bp;

  // Normally, here, we would load the bp from files 'provkey.bin' and 'verifkey.bin'
#ifndef PROVING_KEY_SERIALIZER
  build_circuit( bp, passphrase32 );
#else
  exit(2) ; // TODO
#endif

  cerr << pubkey32[0] << endl ;
  cerr << pubkey32[1] << endl ;
  cerr << pubkey32[2] << endl ;
  cerr << pubkey32[3] << endl ;
  
  cerr << "(5)" << endl ;
  
  bp.val( 0 ) = pubkey32[0];
  bp.val( 1 ) = pubkey32[1];
  bp.val( 2 ) = pubkey32[2];
  bp.val( 3 ) = pubkey32[3];
  
  cerr << "(3)" << endl ;
  
  bp.val( 4 ) = pubkey32[0];
  bp.val( 5 ) = pubkey32[1];
  bp.val( 6 ) = pubkey32[2];
  bp.val( 7 ) = pubkey32[3];

  cerr << passphrase32[0] << endl ;
  cerr << passphrase32[1] << endl ;
  cerr << passphrase32[2] << endl ;
  cerr << passphrase32[3] << endl ;

  bp.val( 8 ) = passphrase32[0];
  bp.val( 9 ) = passphrase32[1];
  bp.val( 10 ) = passphrase32[2];
  bp.val( 11 ) = passphrase32[3];

  cerr << "(4)" << endl ;

  std::cout << "primary input size: " << bp.primary_input().size()<< std::endl;;
  std::cout << "auxiliary input size: " << bp.auxiliary_input().size()<< std::endl;;
  std::cout << "num_inputs: " << bp.num_inputs()<< std::endl;;
  std::cout << "num_variables: " << bp.num_variables() << std::endl;;
  std::cout << "coucou2" << std::endl;
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

  bool satisfied = true ;

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
      satisfied = false ;
    }
  }

  cerr << "(5)" << endl ;
  if( satisfied ){
      cerr << "(6)" << endl ;

    assert(bp.is_satisfied());

      cerr << "(7)" << endl ;
      
    const r1cs_constraint_system<field_type> constraint_system = bp.get_constraint_system();
    const typename r1cs_gg_ppzksnark<curve_type>::keypair_type keypair = generate<r1cs_gg_ppzksnark<curve_type>>(constraint_system);

    cerr << "(8)" << endl ;

    const typename r1cs_gg_ppzksnark<curve_type>::proof_type proof = prove<r1cs_gg_ppzksnark<curve_type>>(keypair.first, bp.primary_input(), bp.auxiliary_input());

    cerr << "(9)" << endl ;


    std::cout << "Number of R1CS constraints: " << constraint_system.num_constraints() << std::endl;
    
    cerr << "(10)" << endl ;
    bool verified = verify<r1cs_gg_ppzksnark<curve_type>>(keypair.second, bp.primary_input(), proof);

    std::cout << "Verification status: " << verified << std::endl;
        //std::cout << "primary input: " << (bp.primary_input()) << std::endl;

    const typename r1cs_gg_ppzksnark<curve_type>::verification_key_type vk = keypair.second;



    std::vector<std::uint8_t> verification_key_byteblob = nil::marshalling::verifier_input_serializer_tvm<scheme_type>::process(
                                                                                                                                keypair.second);
    std::vector<std::uint8_t> primary_input_byteblob = nil::marshalling::verifier_input_serializer_tvm<scheme_type>::process(
                                                                                                                             bp.primary_input());

    std::vector<std::uint8_t> proof_byteblob = nil::marshalling::verifier_input_serializer_tvm<scheme_type>::process(
                                                                                                                     proof);

    {
      std::vector<std::uint8_t> byteblob;

      append_to_byteblob( byteblob, proof_byteblob ) ;
      append_to_byteblob( byteblob, primary_input_byteblob ) ;
      append_to_byteblob( byteblob, verification_key_byteblob ) ;

      binfile_of_byteblob( "big_proof.bin", byteblob );
      hexfile_of_byteblob( "big_proof.hex", byteblob );
    }

    binfile_of_byteblob( "proof.bin", proof_byteblob );
    hexfile_of_byteblob( "proof.hex", proof_byteblob );
    
    binfile_of_byteblob( "primary_input.bin", primary_input_byteblob );
    hexfile_of_byteblob( "primary_input.hex", primary_input_byteblob );

#ifndef PROVING_KEY_SERIALIZER
    binfile_of_byteblob( "verifkey.bin", verification_key_byteblob );
    hexfile_of_byteblob( "verifkey.hex", verification_key_byteblob );
#endif

  }

}

void print_usage(std::ostream &cout, std::string command )
{
    cout << command << " SUBCOMMAND [ARGUMENTS]" << endl ;
    cout << "Available subcommands:" << endl ;
    cout << "  * prepare PASSPHRASE : output circuit for PASSPHRASE to 'provkey.bin' and 'verifkey.bin'" << endl ;
    cout << "  * prove PASSPHRASE PUBKEY : generate 'proof.bin', 'verifkey.bin', 'variables.bin' and 'big_proof.bin'" << endl ;
    cout << "Arguments:" << endl ;
    cout << "  PASSPHRASE: an ASCII string that you have to memorize" << endl ;
    cout << "  PUBKEY: the Hexadecimal representation of your pubkey (without 0x)" << endl ;
  
}

int main(int argc, char *argv[]) {

  if( argc == 1 ){
    print_usage ( cout, argv[0] ) ;
    return 0 ;
  }

  std::string subcommand = argv[1] ;
  if( subcommand == "prepare" ){
    cerr << "prepare" << endl ;
    if( argc != 3 ){
      cerr << "Bad number of arguments:" << endl ;
      print_usage ( cerr, argv[0] ) ;
      return 1;
    }

    prepare_circuit( argv[2] );
    return 0 ;
  } else
  if( subcommand == "prove" ){
    cerr << "prove" << endl ;
    if( argc != 4 ){
      cerr << "Bad number of arguments:" << endl ;
      print_usage ( cerr, argv[0] ) ;
      return 1;
    }
    use_circuit( argv[2], argv[3] );
    return 0 ;
  } else {
    cerr << "Unknown subcommand: " << subcommand << endl;
    return 2 ;
  }

}
