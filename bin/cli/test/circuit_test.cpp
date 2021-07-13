#define BOOST_TEST_MODULE circuit_test

#include <boost/test/included/unit_test.hpp>

#include <nil/crypto3/algebra/curves/bls12.hpp>
#include <nil/crypto3/algebra/fields/bls12/base_field.hpp>
#include <nil/crypto3/algebra/fields/bls12/scalar_field.hpp>
#include <nil/crypto3/algebra/fields/arithmetic_params/bls12.hpp>
#include <nil/crypto3/algebra/curves/params/multiexp/bls12.hpp>
#include <nil/crypto3/algebra/curves/params/wnaf/bls12.hpp>

#include <nil/crypto3/zk/components/blueprint.hpp>

#include "../src/circuit.hpp"

using namespace nil::crypto3;
using namespace zk::components;

typedef algebra::curves::bls12<381> curve_type;
typedef typename curve_type::scalar_field_type field_type;

typedef hmac_component<field_type,
                knapsack_crh_with_bit_out_component<field_type>,
                knapsack_crh_with_field_out_component<field_type>>
    Hmac;

BOOST_AUTO_TEST_SUITE(circuit_test_suite)

BOOST_AUTO_TEST_CASE(circuit_test) {
    std::cout << "Circuit test started" << std::endl;

    std::vector<std::vector<bool>> secrets {
        {1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1},
        {1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1},
        {0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1},
        {1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1}
    };

    std::vector<field_type::value_type> hashes(4);

    for(int i = 0; i < 4; ++i) {
        hashes[i] = Hmac::get_hmac(secrets[i], std::vector<bool>(circuit::HASH_MSG_LEN, 1)) [0];
    }

    std::vector<field_type::value_type> hash_list {hashes[0],hashes[1],hashes[2],0,0,0,0,0,0,0};

    std::vector<std::uint32_t> vote_choices {0,1,2,10000000,4294967295};
    for(std::size_t index = 0; index < 4; ++index) {
        field_type::value_type anoymous_id =
            Hmac::get_hmac(secrets[index], std::vector<bool>(circuit::ANONYMOUS_ID_MSG_LEN, 1))[0];

        for(std::uint32_t vote_choice : vote_choices) {
            std::vector<bool> vote_choice_bv(circuit::VOTE_MSG_LEN);

            for(std::size_t i = 0, temp = vote_choice; i < circuit::VOTE_MSG_LEN; ++i) {
                vote_choice_bv[i] = temp&1;
                temp >>= 1;
            }

            field_type::value_type vote_choice_hmac =
                Hmac::get_hmac(secrets[index], vote_choice_bv)[0];

            for(int real_vote_hmac = 0; real_vote_hmac < 2; ++real_vote_hmac) {
                for(int real_anonymous_id  = 0; real_anonymous_id < 2; ++real_anonymous_id) {
                    std::cout << "Checking secret number: " << index <<
                            ", vote choice: " << vote_choice <<
                            ", index: " << index <<
                            ", real vote hmac: " << (real_vote_hmac ? "true" : "false") <<
                            ", real anonymous id: " << (real_anonymous_id ?  "true" : "false") <<
                            std::endl;
                    blueprint<field_type> bp = circuit::generate_circuit_with_witness<field_type>(
                        hash_list,
                        secrets[index],
                        vote_choice,
                        index,
                        real_vote_hmac ? vote_choice_hmac : hashes[0],
                        real_anonymous_id ? anoymous_id : hashes[1]
                    );
                    if(index!=3 &&
                            real_vote_hmac &&
                            real_anonymous_id) {
                        BOOST_CHECK(bp.is_satisfied());
                    } else {
                        BOOST_CHECK(!bp.is_satisfied());
                    }
                }
            }
        }
    }

    for(std::size_t secret_index = 0; secret_index < 4; ++secret_index) {
        field_type::value_type anoymous_id =
            Hmac::get_hmac(secrets[secret_index], std::vector<bool>(circuit::ANONYMOUS_ID_MSG_LEN, 1))[0];

        std::uint32_t vote_choice = 0;
        std::vector<bool> vote_choice_bv(circuit::VOTE_MSG_LEN);

        for(std::size_t i = 0, temp = vote_choice; i < circuit::VOTE_MSG_LEN; ++i) {
            vote_choice_bv[i] = temp&1;
            temp >>= 1;
        }

        field_type::value_type vote_choice_hmac =
            Hmac::get_hmac(secrets[secret_index], vote_choice_bv)[0];

        for(std::size_t index = 0; index < 10; ++index) {
            std::cout << "Checking secret number: " << secret_index <<
                    ", vote choice: " << vote_choice <<
                    ", index: " << index <<
                    std::endl;
            blueprint<field_type> bp = circuit::generate_circuit_with_witness<field_type>(
                hash_list,
                secrets[secret_index],
                vote_choice,
                index,
                vote_choice_hmac,
                anoymous_id
            );
            if(secret_index!=3 && secret_index == index
            ) {
                BOOST_CHECK(bp.is_satisfied());
            } else {
                BOOST_CHECK(!bp.is_satisfied());
            }
        }        
    }
}

BOOST_AUTO_TEST_SUITE_END()