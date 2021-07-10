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

#include "sudoku.hpp"

using namespace nil::crypto3::zk::snark;
using namespace nil::crypto3::algebra;

int test(){

    using curve_type = curves::bls12<381>;
    using field_type = typename curve_type::scalar_field_type;

    // Create blueprint

    blueprint<field_type> bp;
    //private (intermediary) variables

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
    blueprint_variable<field_type> free_x_0_0;
    blueprint_variable<field_type> free2_x_0_0;
    blueprint_variable<field_type> free_x_0_1;
    blueprint_variable<field_type> free2_x_0_1;
    blueprint_variable<field_type> free_x_0_2;
    blueprint_variable<field_type> free2_x_0_2;
    blueprint_variable<field_type> free_x_0_3;
    blueprint_variable<field_type> free2_x_0_3;
    blueprint_variable<field_type> free_x_1_0;
    blueprint_variable<field_type> free2_x_1_0;
    blueprint_variable<field_type> free_x_1_1;
    blueprint_variable<field_type> free2_x_1_1;
    blueprint_variable<field_type> free_x_1_2;
    blueprint_variable<field_type> free2_x_1_2;
    blueprint_variable<field_type> free_x_1_3;
    blueprint_variable<field_type> free2_x_1_3;
    blueprint_variable<field_type> free_x_2_0;
    blueprint_variable<field_type> free2_x_2_0;
    blueprint_variable<field_type> free_x_2_1;
    blueprint_variable<field_type> free2_x_2_1;
    blueprint_variable<field_type> free_x_2_2;
    blueprint_variable<field_type> free2_x_2_2;
    blueprint_variable<field_type> free_x_2_3;
    blueprint_variable<field_type> free2_x_2_3;
    blueprint_variable<field_type> free_x_3_0;
    blueprint_variable<field_type> free2_x_3_0;
    blueprint_variable<field_type> free_x_3_1;
    blueprint_variable<field_type> free2_x_3_1;
    blueprint_variable<field_type> free_x_3_2;
    blueprint_variable<field_type> free2_x_3_2;
    blueprint_variable<field_type> free_x_3_3;
    blueprint_variable<field_type> free2_x_3_3;

    //blueprint_variable<field_type> out;
    //blueprint_variable<field_type> x;

    // Allocate variables
    //allocate public variables to blueprint
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
    free_x_0_0.allocate(bp);
    free2_x_0_0.allocate(bp);
    free_x_0_1.allocate(bp);
    free2_x_0_1.allocate(bp);
    free_x_0_2.allocate(bp);
    free2_x_0_2.allocate(bp);
    free_x_0_3.allocate(bp);
    free2_x_0_3.allocate(bp);
    free_x_1_0.allocate(bp);
    free2_x_1_0.allocate(bp);
    free_x_1_1.allocate(bp);
    free2_x_1_1.allocate(bp);
    free_x_1_2.allocate(bp);
    free2_x_1_2.allocate(bp);
    free_x_1_3.allocate(bp);
    free2_x_1_3.allocate(bp);
    free_x_2_0.allocate(bp);
    free2_x_2_0.allocate(bp);
    free_x_2_1.allocate(bp);
    free2_x_2_1.allocate(bp);
    free_x_2_2.allocate(bp);
    free2_x_2_2.allocate(bp);
    free_x_2_3.allocate(bp);
    free2_x_2_3.allocate(bp);
    free_x_3_0.allocate(bp);
    free2_x_3_0.allocate(bp);
    free_x_3_1.allocate(bp);
    free2_x_3_1.allocate(bp);
    free_x_3_2.allocate(bp);
    free2_x_3_2.allocate(bp);
    free_x_3_3.allocate(bp);
    free2_x_3_3.allocate(bp);

    //out.allocate(bp);
    //x.allocate(bp);

    // This sets up the blueprint variables
    // so that the first one (out) represents the public
    // input and the rest is private input

    bp.set_input_sizes(0);

    // Initialize component

    test_component<field_type> g(bp,x_0_0,x_0_1,x_0_2,x_0_3,x_1_0,x_1_1,x_1_2,x_1_3,x_2_0,x_2_1,x_2_2,x_2_3,x_3_0,x_3_1,x_3_2,x_3_3,free_x_0_0,free2_x_0_0,free_x_0_1,free2_x_0_1,free_x_0_2,free2_x_0_2,free_x_0_3,free2_x_0_3,free_x_1_0,free2_x_1_0,free_x_1_1,free2_x_1_1,free_x_1_2,free2_x_1_2,free_x_1_3,free2_x_1_3,free_x_2_0,free2_x_2_0,free_x_2_1,free2_x_2_1,free_x_2_2,free2_x_2_2,free_x_2_3,free2_x_2_3,free_x_3_0,free2_x_3_0,free_x_3_1,free2_x_3_1,free_x_3_2,free2_x_3_2,free_x_3_3,free2_x_3_3);
    g.generate_r1cs_constraints();

    // Add witness values
    bp.val(x_0_0) = 1;
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
    bp.val(x_3_3) = 2;

    //bp.val(out) = 35;
    //bp.val(x) = 3;

    g.generate_r1cs_witness();

    std::cout << "primary input size" << bp.primary_input().size()<< std::endl;;
    std::cout << "auxiliary input size" << bp.auxiliary_input().size()<< std::endl;;
    std::cout << "num_inputs" << bp.num_inputs()<< std::endl;;
    std::cout << "num_variables" << bp.num_variables() << std::endl;;
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

    assert(bp.is_satisfied());

    const r1cs_constraint_system<field_type> constraint_system = bp.get_constraint_system();

    const typename r1cs_gg_ppzksnark<curve_type>::keypair_type keypair = generate<r1cs_gg_ppzksnark<curve_type>>(constraint_system);

    const typename r1cs_gg_ppzksnark<curve_type>::proof_type proof = prove<r1cs_gg_ppzksnark<curve_type>>(keypair.first, bp.primary_input(), bp.auxiliary_input());

    bool verified = verify<r1cs_gg_ppzksnark<curve_type>>(keypair.second, bp.primary_input(), proof);

    std::cout << "Number of R1CS constraints: " << constraint_system.num_constraints() << std::endl;
    std::cout << "Verification status: " << verified << std::endl;
    //std::cout << "primary input: " << (bp.primary_input()) << std::endl;

    const typename r1cs_gg_ppzksnark<curve_type>::verification_key_type vk = keypair.second;

    return 0;
}

 