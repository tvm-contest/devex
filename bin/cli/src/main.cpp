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
#include <boost/random.hpp>
#include <boost/algorithm/hex.hpp>

#include "list_contains_component.hpp"

#include <nil/crypto3/algebra/curves/bls12.hpp>
#include <nil/crypto3/algebra/fields/bls12/base_field.hpp>
#include <nil/crypto3/algebra/fields/bls12/scalar_field.hpp>
#include <nil/crypto3/algebra/fields/arithmetic_params/bls12.hpp>
#include <nil/crypto3/algebra/curves/params/multiexp/bls12.hpp>
#include <nil/crypto3/algebra/curves/params/wnaf/bls12.hpp>

#include <nil/crypto3/zk/components/blueprint.hpp>
#include <nil/crypto3/zk/components/blueprint_variable.hpp>

#include <nil/crypto3/zk/components/hashes/knapsack/knapsack_component.hpp>
#include <nil/crypto3/zk/components/hashes/hmac_component.hpp>
#include <nil/crypto3/zk/components/disjunction.hpp>

#include <nil/crypto3/zk/snark/schemes/ppzksnark/r1cs_gg_ppzksnark.hpp>
#include <nil/crypto3/zk/snark/schemes/ppzksnark/r1cs_gg_ppzksnark/marshalling.hpp>

#include <nil/crypto3/zk/snark/algorithms/generate.hpp>
#include <nil/crypto3/zk/snark/algorithms/verify.hpp>
#include <nil/crypto3/zk/snark/algorithms/prove.hpp>

using namespace nil::crypto3;
using namespace zk::components;

typedef algebra::curves::bls12<381> curve_type;
typedef typename curve_type::scalar_field_type field_type;

typedef zk::snark::r1cs_gg_ppzksnark<curve_type> scheme_type;

typedef hmac_component<field_type,
                       knapsack_crh_with_bit_out_component<field_type>,
                       knapsack_crh_with_field_out_component<field_type>>
    Hmac;

const std::size_t SECRET_BITS_SIZE = 256;
constexpr const std::size_t modulus_bits = field_type::modulus_bits;
constexpr const std::size_t modulus_chunks = modulus_bits / 8 + (modulus_bits % 8 ? 1 : 0);
const std::size_t PRIMARY_INPUT_SIZE = 13;
const std::size_t MAX_ENTRIES = 10;
const std::size_t VOTE_MSG_LEN = 32;
const std::size_t HASH_MSG_LEN = 33;
const std::size_t ANONYMOUS_ID_MSG_LEN = 34;


std::string field_element_to_hex(field_type::value_type element) {
    std::string hex;
    std::vector<std::uint8_t> byteblob(modulus_chunks);
    std::vector<std::uint8_t>::iterator write_iter = byteblob.begin();
    nil::marshalling::verifier_input_serializer_tvm<scheme_type>::field_type_process<field_type>(element, write_iter);
    boost::algorithm::hex(byteblob.begin(), byteblob.end(), std::back_inserter(hex));
    return hex;
}

void generate_vote_secret() {
    boost::random::random_device rd;
    std::vector<std::uint8_t> secret_byteblob(SECRET_BITS_SIZE / 8);
    rd.generate(secret_byteblob.begin(), secret_byteblob.end());
    std::vector<bool> secret_bitblob(256);
    detail::pack<stream_endian::big_octet_big_bit, stream_endian::big_octet_big_bit, 8, 1>(
        secret_byteblob.begin(), secret_byteblob.end(), secret_bitblob.begin());

    field_type::value_type hash = Hmac::get_hmac(secret_bitblob, std::vector<bool>(HASH_MSG_LEN, 1)) [0];

    std::string hash_hex = field_element_to_hex(hash);

    boost::filesystem::path secret_path(hash_hex);
    boost::filesystem::ofstream secretof(secret_path);
    for (auto byte : secret_byteblob) {
        secretof << byte;
    }
    secretof.close();
    std::cout << "Voting secret has been saved to " << hash_hex << std::endl;
    std::cout << "Voting secret hash is: " << hash_hex << std::endl;
}

int main(int argc, char *argv[]) {
    boost::filesystem::path pout, pkout, vkout, sin, hlin;
    std::uint32_t vote_choice;
    boost::program_options::options_description options(
        "R1CS Generic Group PreProcessing Zero-Knowledge Succinct Non-interactive ARgument of Knowledge "
        "(https://eprint.iacr.org/2016/260.pdf) CLI Proof Generator");
    // clang-format off
    options.add_options()("help,h", "Display help message")
    ("version,v", "Display version")
    ("generate-vote-secret", "Generate vote secret")
    ("generate-keypair", "Generate keys")
    ("prove", "Generate proof")
    ("proof-output,po", boost::program_options::value<boost::filesystem::path>(&pout)->default_value("proof"))
    ("proving-key-output,pko", boost::program_options::value<boost::filesystem::path>(&pkout)->default_value("pkey"))
    ("verifying-key-output,vko", boost::program_options::value<boost::filesystem::path>(&vkout)->default_value("vkey"))
    ("secret,s", boost::program_options::value<boost::filesystem::path>(&sin))
    ("hash-list,hl", boost::program_options::value<boost::filesystem::path>(&hlin))
    ("vote", boost::program_options::value<std::uint32_t>(&vote_choice));

    // clang-format on

    boost::program_options::variables_map vm;
    boost::program_options::store(boost::program_options::command_line_parser(argc, argv).options(options).run(), vm);
    boost::program_options::notify(vm);

    if (vm.count("help") || argc < 2) {
        std::cout << options << std::endl;
        return 0;
    }

    if (vm.count("prove")) {
        if (!(vm.count("secret") && vm.count("hash-list") && vm.count("vote"))) {
            std::cerr << "--secret, --hash-list and --vote are required." << std::endl;
            return 1;
        } else if (!boost::filesystem::exists(sin)) {
            std::cerr << "file not found: " << sin << std::endl;
            return 1;
        } else if (!boost::filesystem::exists(hlin)) {
            std::cerr << "file not found: " << hlin << std::endl;
            return 1;
        }
    }

    if (vm.count("generate-vote-secret")) {
        generate_vote_secret();
        return 0;
    }

    blueprint<field_type> bp;

    // public input varibles

    // packed hashes of permitted voting secrets
    blueprint_variable_vector<field_type> voting_secrets_hashes;
    voting_secrets_hashes.allocate(bp, MAX_ENTRIES);
    // the vote choice, uint32
    blueprint_variable<field_type> vote;
    vote.allocate(bp);
    // Hmac(secret,little endian vote)
    blueprint_variable<field_type> signed_vote;
    signed_vote.allocate(bp);

    // Hmac(secret, ANONYMOUS_ID_MSG_LEN ones)
    blueprint_variable<field_type> anonymous_id;
    anonymous_id.allocate(bp);
    assert(bp.num_variables() == PRIMARY_INPUT_SIZE);
    bp.set_input_sizes(PRIMARY_INPUT_SIZE);

    // auxilary input variables

    digest_variable<field_type> voting_secret(bp, SECRET_BITS_SIZE);

    // components for verification of the voting secret.

    // Hmac(secret, HASH_MSG_LEN ones)
    blueprint_variable<field_type> secret_hash;
    secret_hash.allocate(bp);
    block_variable<field_type> secret_block(bp, {voting_secret.bits});

    // blueprint_variable not allocated, therfore constant and equal to 1.
    blueprint_variable<field_type> one;

    block_variable<field_type> hash_msg_block(bp,
        {blueprint_variable_vector<field_type>(HASH_MSG_LEN, one)});
    Hmac secret_hmac_comp(bp,
                          secret_block,
                          hash_msg_block,
                          blueprint_variable_vector<field_type>(1, secret_hash));
    
    // The voters set may contain zeros if there is less than maximum voters.
    // So we have to make sure the secret's hash is not zero.
    blueprint_variable_vector<field_type> secret_hash_bits;
    secret_hash_bits.allocate(bp, modulus_bits);
    packing_component<field_type> secret_hash_pack(bp, secret_hash_bits, secret_hash);
    blueprint_variable<field_type> not_all_zeros;
    not_all_zeros.allocate(bp);
    disjunction<field_type> test_not_all_zeros(bp, secret_hash_bits, not_all_zeros);

    list_contains_component<field_type> list_contains_comp(bp,
                                                           MAX_ENTRIES,
                                                           voting_secrets_hashes,
                                                           secret_hash);

    // components for signed vote

    blueprint_variable_vector<field_type> vote_bits;
    vote_bits.allocate(bp, VOTE_MSG_LEN);
    packing_component<field_type> vote_pack(bp, vote_bits, vote);
    block_variable<field_type> vote_block(bp, {vote_bits});
    Hmac vote_hmac(bp, secret_block, vote_block, blueprint_variable_vector<field_type>(1, signed_vote));

    // componenets for verification of id

    block_variable<field_type> anoynymous_id_msg_block(bp,
     {blueprint_variable_vector<field_type>(ANONYMOUS_ID_MSG_LEN, one)});
    Hmac anonymous_id_msg_hmac(bp,
                       secret_block,
                       anoynymous_id_msg_block,
                       blueprint_variable_vector<field_type>(1, anonymous_id));

    // generate constraints

    // constraints for verification of the voting secret.

    voting_secret.generate_r1cs_constraints();
    secret_hmac_comp.generate_r1cs_constraints();
    secret_hash_pack.generate_r1cs_constraints(true);
    test_not_all_zeros.generate_r1cs_constraints();
    generate_r1cs_equals_const_constraint<field_type>(bp, not_all_zeros, 1);
    
    list_contains_comp.generate_r1cs_constraints();

    // constraints for signed vote.

    vote_pack.generate_r1cs_constraints(true);
    vote_hmac.generate_r1cs_constraints();

    // constraints for id

    anonymous_id_msg_hmac.generate_r1cs_constraints();

    typename scheme_type::keypair_type keypair;
    if (vm.count("generate-keypair")) {
        std::cout << "Starting generator" << std::endl;
        zk::snark::r1cs_constraint_system<field_type> constraint_system = bp.get_constraint_system();
        std::cout << constraint_system.num_constraints() << std::endl;
        std::cout << constraint_system.num_variables() << std::endl;
        keypair = zk::snark::generate<scheme_type>(constraint_system);
        std::vector<std::uint8_t> verification_key_byteblob =
            nil::marshalling::verifier_input_serializer_tvm<scheme_type>::process(keypair.second);
        boost::filesystem::ofstream vkoutf(vkout);
        for (const auto &v : verification_key_byteblob) {
            vkoutf << v;
        }
        vkoutf.close();
    } else {
        std::cerr << "Keys must be generated each time." << std::endl;
        // return 1;
    }

    if (vm.count("prove")) {
        boost::filesystem::ifstream sinf(sin);
        std::vector<std::uint8_t> secret_byteblob(SECRET_BITS_SIZE / 8);
        for (std::uint8_t &byte : secret_byteblob) {
            sinf >> byte;
        }
        std::vector<bool> secret_bv(SECRET_BITS_SIZE);
        nil::crypto3::detail::pack<stream_endian::big_octet_big_bit, stream_endian::big_octet_big_bit, 8, 1>(
            secret_byteblob.begin(), secret_byteblob.end(), secret_bv.begin());

        boost::filesystem::ifstream hlinf(hlin);

        std::vector<std::string> hashes_hex;

        std::size_t i = 0;
        while (!hlinf.eof()) {
            std::string line;
            std::getline(hlinf, line);
            if (!line.empty()) {
                hashes_hex.insert(hashes_hex.end(), line);
            }
        }

        std::vector<std::vector<std::uint8_t>> hashes_bytes(hashes_hex.size());
        for (std::size_t i = 0; i < hashes_hex.size(); ++i) {
            if (hashes_hex[i].size() != modulus_chunks * 2) {
                std::cout << "Hash number " << i + 1 << " is not " << modulus_chunks * 2 << "character long but "
                          << hashes_hex.size() << std::endl;
                return 1;
            }
            hashes_bytes[i].resize(modulus_chunks);
            boost::algorithm::unhex(hashes_hex[i].begin(), hashes_hex[i].end(), hashes_bytes[i].begin());
        }

        std::vector<field_type::value_type> hashes_field_elements(MAX_ENTRIES);

        for (size_t i = 0; i < hashes_bytes.size(); ++i) {
            nil::marshalling::status_type status;
            hashes_field_elements[i] =
                nil::marshalling::verifier_input_deserializer_tvm<scheme_type>::field_type_process<field_type>(
                    hashes_bytes[i].cbegin(), hashes_bytes[i].cend(), status);
        }

        for (size_t i = hashes_bytes.size(); i < hashes_field_elements.size(); ++i) {
            hashes_field_elements[i] = field_type::value_type::zero();
        }

        // generate witness

        for (size_t i = 0; i < hashes_field_elements.size(); i++) {
            bp.val(voting_secrets_hashes[i]) = hashes_field_elements[i];
        }

        voting_secret.generate_r1cs_witness(secret_bv);
        secret_hmac_comp.generate_r1cs_witness();
        secret_hash_pack.generate_r1cs_witness_from_packed();
        test_not_all_zeros.generate_r1cs_witness();

        std::string hash_hex = field_element_to_hex(bp.val(secret_hash));
        std::cout << hash_hex << std::endl;
        list_contains_comp.generate_r1cs_witness();

        // witness generation for signed vote
        bp.val(vote) = vote_choice;
        vote_pack.generate_r1cs_witness_from_packed();
        vote_hmac.generate_r1cs_witness();

        // constraints for id

        anonymous_id_msg_hmac.generate_r1cs_witness();

        std::cout << "is blueprint satisfied:" << (bp.is_satisfied() ? "true" : "false") << std::endl;

        std::cout << "Starting prover" << std::endl;

        const typename scheme_type::proof_type proof =
            zk::snark::prove<scheme_type>(keypair.first, bp.primary_input(), bp.auxiliary_input());
        std::vector<std::uint8_t> proof_byteblob =
            nil::marshalling::verifier_input_serializer_tvm<scheme_type>::process(proof);
        boost::filesystem::ofstream poutf(pout);
        for (const auto &v : proof_byteblob) {
            poutf << v;
        }
        poutf.close();

        std::string signed_vote_hex = field_element_to_hex(bp.val(signed_vote));
        std::cout << "Your signed vote is: " << signed_vote_hex << std::endl;

        std::string anonymous_id_hex = field_element_to_hex(bp.val(anonymous_id));
        std::cout << "Your anonymous voter id is: " << anonymous_id_hex << std::endl;
    }

    return 0;
}
