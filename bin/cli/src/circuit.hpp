#include <nil/crypto3/zk/components/blueprint.hpp>
#include <nil/crypto3/zk/components/blueprint_variable.hpp>

#include <nil/crypto3/zk/components/hashes/knapsack/knapsack_component.hpp>
#include <nil/crypto3/zk/components/hashes/hmac_component.hpp>
#include <nil/crypto3/zk/components/disjunction.hpp>

#include "list_contains_component.hpp"

using namespace nil::crypto3;
using namespace nil::crypto3::zk::components;
//using namespace nil::crypto3::algebra;
using namespace nil::crypto3::zk::snark;

namespace circuit {
    template <typename FieldType>
    struct generated_primary_input {
        typename FieldType::value_type signed_vote;
        typename FieldType::value_type anonymous_id;
    };
}

namespace {
    template <typename FieldType>
    blueprint<FieldType> generate_circuit_internal(
        const std::vector<typename FieldType::value_type> &hashes_field_elements={},
        const std::vector<bool> &secret_bv={},
        std::uint32_t vote_choice=0,
        circuit::generated_primary_input<FieldType> *primary_input_out = nullptr,
        bool generate_witness = false
        ) {
        typedef hmac_component<FieldType,
                        knapsack_crh_with_bit_out_component<FieldType>,
                        knapsack_crh_with_field_out_component<FieldType>>
            Hmac;

        const std::size_t SECRET_BITS_SIZE = 256;
        constexpr const std::size_t modulus_bits = FieldType::modulus_bits;
        constexpr const std::size_t modulus_chunks = modulus_bits / 8 + (modulus_bits % 8 ? 1 : 0);
        const std::size_t PRIMARY_INPUT_SIZE = 13;
        const std::size_t MAX_ENTRIES = 10;
        const std::size_t VOTE_MSG_LEN = 32;
        const std::size_t HASH_MSG_LEN = 33;
        const std::size_t ANONYMOUS_ID_MSG_LEN = 34;


        blueprint<FieldType> bp;
            // public input varibles

        // packed hashes of permitted voting secrets
        blueprint_variable_vector<FieldType> voting_secrets_hashes;
        voting_secrets_hashes.allocate(bp, MAX_ENTRIES);
        // the vote choice, uint32
        blueprint_variable<FieldType> vote;
        vote.allocate(bp);
        // Hmac(secret,little endian vote)
        blueprint_variable<FieldType> signed_vote;
        signed_vote.allocate(bp);

        // Hmac(secret, ANONYMOUS_ID_MSG_LEN ones)
        blueprint_variable<FieldType> anonymous_id;
        anonymous_id.allocate(bp);
        assert(bp.num_variables() == PRIMARY_INPUT_SIZE);
        bp.set_input_sizes(PRIMARY_INPUT_SIZE);

        // auxilary input variables

        digest_variable<FieldType> voting_secret(bp, SECRET_BITS_SIZE);

        // components for verification of the voting secret.

        // Hmac(secret, HASH_MSG_LEN ones)
        blueprint_variable<FieldType> secret_hash;
        secret_hash.allocate(bp);
        block_variable<FieldType> secret_block(bp, {voting_secret.bits});

        // blueprint_variable not allocated, therfore constant and equal to 1.
        blueprint_variable<FieldType> one;

        block_variable<FieldType> hash_msg_block(bp,
            {blueprint_variable_vector<FieldType>(HASH_MSG_LEN, one)});
        Hmac secret_hmac_comp(bp,
                            secret_block,
                            hash_msg_block,
                            blueprint_variable_vector<FieldType>(1, secret_hash));
        
        // The voters set may contain zeros if there is less than maximum voters.
        // So we have to make sure the secret's hash is not zero.
        blueprint_variable_vector<FieldType> secret_hash_bits;
        secret_hash_bits.allocate(bp, modulus_bits);
        packing_component<FieldType> secret_hash_pack(bp, secret_hash_bits, secret_hash);
        blueprint_variable<FieldType> not_all_zeros;
        not_all_zeros.allocate(bp);
        disjunction<FieldType> test_not_all_zeros(bp, secret_hash_bits, not_all_zeros);

        list_contains_component<FieldType> list_contains_comp(bp,
                                                            MAX_ENTRIES,
                                                            voting_secrets_hashes,
                                                            secret_hash);

        // components for signed vote

        blueprint_variable_vector<FieldType> vote_bits;
        vote_bits.allocate(bp, VOTE_MSG_LEN);
        packing_component<FieldType> vote_pack(bp, vote_bits, vote);
        block_variable<FieldType> vote_block(bp, {vote_bits});
        Hmac vote_hmac(bp, secret_block, vote_block, blueprint_variable_vector<FieldType>(1, signed_vote));

        // componenets for verification of id

        block_variable<FieldType> anoynymous_id_msg_block(bp,
        {blueprint_variable_vector<FieldType>(ANONYMOUS_ID_MSG_LEN, one)});
        Hmac anonymous_id_msg_hmac(bp,
                        secret_block,
                        anoynymous_id_msg_block,
                        blueprint_variable_vector<FieldType>(1, anonymous_id));

        // generate constraints

        // constraints for verification of the voting secret.

        voting_secret.generate_r1cs_constraints();
        secret_hmac_comp.generate_r1cs_constraints();
        secret_hash_pack.generate_r1cs_constraints(true);
        test_not_all_zeros.generate_r1cs_constraints();
        generate_r1cs_equals_const_constraint<FieldType>(bp, not_all_zeros, 1);
        
        list_contains_comp.generate_r1cs_constraints();

        // constraints for signed vote.

        vote_pack.generate_r1cs_constraints(true);
        vote_hmac.generate_r1cs_constraints();

        // constraints for id

        anonymous_id_msg_hmac.generate_r1cs_constraints();

        if(generate_witness) {
            assert(hashes_field_elements.size() == MAX_ENTRIES);
            assert(secret_bv.size() == SECRET_BITS_SIZE);
            assert(primary_input_out != nullptr);
            // generate witness
            
            for (size_t i = 0; i < hashes_field_elements.size(); i++) {
                bp.val(voting_secrets_hashes[i]) = hashes_field_elements[i];
            }

            voting_secret.generate_r1cs_witness(secret_bv);
            secret_hmac_comp.generate_r1cs_witness();
            secret_hash_pack.generate_r1cs_witness_from_packed();
            test_not_all_zeros.generate_r1cs_witness();

            // std::string hash_hex = field_element_to_hex(bp.val(secret_hash));
            // std::cout << hash_hex << std::endl;
            list_contains_comp.generate_r1cs_witness();

            // witness generation for signed vote
            bp.val(vote) = vote_choice;
            vote_pack.generate_r1cs_witness_from_packed();
            vote_hmac.generate_r1cs_witness();

            // witness generation for id

            anonymous_id_msg_hmac.generate_r1cs_witness();

            primary_input_out->signed_vote = bp.val(signed_vote);
            primary_input_out->anonymous_id = bp.val(anonymous_id);
        }

        return bp;
    }

};

namespace circuit {
    template <typename FieldType>
    blueprint<FieldType> generate_circuit_with_witness(
        const std::vector<typename FieldType::value_type> &hashes_field_elements,
        const std::vector<bool> &secret_bv,
        std::uint32_t vote_choice,
        generated_primary_input<FieldType> *primary_input_out
        ) {
            return generate_circuit_internal<FieldType>(
                hashes_field_elements,
                secret_bv,
                vote_choice,
                primary_input_out,
                true
            );
        }
    
    template <typename FieldType>
    blueprint<FieldType> generate_circuit() {
        return generate_circuit_internal<FieldType>();
    }
}