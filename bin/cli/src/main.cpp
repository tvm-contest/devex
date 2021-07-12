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

#include "circuit.hpp"
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
typedef nil::marshalling::verifier_input_serializer_tvm<scheme_type> serializer_tvm;
typedef nil::marshalling::verifier_input_deserializer_tvm<scheme_type> deserializer_tvm;
typedef hmac_component<field_type,
                       knapsack_crh_with_bit_out_component<field_type>,
                       knapsack_crh_with_field_out_component<field_type>>
    Hmac;

constexpr const std::size_t modulus_bits = field_type::modulus_bits;
constexpr const std::size_t modulus_chunks = modulus_bits / 8 + (modulus_bits % 8 ? 1 : 0);


std::string field_element_to_hex(field_type::value_type element) {
    std::string hex;
    std::vector<std::uint8_t> byteblob(modulus_chunks);
    std::vector<std::uint8_t>::iterator write_iter = byteblob.begin();
    serializer_tvm::field_type_process<field_type>(element, write_iter);
    boost::algorithm::hex(byteblob.begin(), byteblob.end(), std::back_inserter(hex));
    return hex;
}

inline std::vector<uint8_t> read_vector_from_disk(boost::filesystem::path file_path) {
    boost::filesystem::ifstream instream(file_path, std::ios::in | std::ios::binary);
    std::vector<uint8_t> data((std::istreambuf_iterator<char>(instream)), std::istreambuf_iterator<char>());
    return data;
}

inline void write_vector_to_disk(boost::filesystem::path file_path, const std::vector<uint8_t> &data) {
    boost::filesystem::ofstream ostream(file_path, std::ios::out | std::ios::binary);
    for(auto byte : data) {
        ostream << byte;
    }
}

void generate_vote_secret() {
    boost::random::random_device rd;
    std::vector<std::uint8_t> secret_byteblob(circuit::SECRET_BITS_SIZE / 8);
    rd.generate(secret_byteblob.begin(), secret_byteblob.end());
    std::vector<bool> secret_bitblob(256);
    nil::crypto3::detail::pack<stream_endian::big_octet_big_bit, stream_endian::big_octet_big_bit, 8, 1>(
        secret_byteblob.begin(), secret_byteblob.end(), secret_bitblob.begin());

    field_type::value_type hash = Hmac::get_hmac(secret_bitblob, std::vector<bool>(circuit::HASH_MSG_LEN, 1)) [0];

    std::string hash_hex = field_element_to_hex(hash);

    boost::filesystem::path secret_path(hash_hex);
    write_vector_to_disk(secret_path, secret_byteblob);
    std::cout << "Voting secret has been saved to " << hash_hex << std::endl;
    std::cout << "Voting secret hash is: " << hash_hex << std::endl;
}

int main(int argc, char *argv[]) {
    boost::filesystem::path pout, pkout, vkout, pkin, sin, hlin;
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
    ("proving-key,pk", boost::program_options::value<boost::filesystem::path>(&pkin)->default_value("pkey"))
    ("proving-key-output,pko", boost::program_options::value<boost::filesystem::path>(&pkout))
    ("verifying-key-output,vko", boost::program_options::value<boost::filesystem::path>(&vkout))
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
    if(!vm.count("prove")) {
        bp = circuit::generate_circuit<field_type>();
    } else {
        std::vector<std::uint8_t> secret_byteblob = read_vector_from_disk(sin);
        assert(secret_byteblob.size() == circuit::SECRET_BITS_SIZE / 8);
        std::vector<bool> secret_bv(circuit::SECRET_BITS_SIZE);
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

        std::vector<field_type::value_type> hashes_field_elements(circuit::MAX_VOTERS);

        for (size_t i = 0; i < hashes_bytes.size(); ++i) {
            nil::marshalling::status_type status;
            hashes_field_elements[i] =
                deserializer_tvm::field_type_process<field_type>(
                    hashes_bytes[i].cbegin(), hashes_bytes[i].cend(), status);
        }

        for (size_t i = hashes_bytes.size(); i < hashes_field_elements.size(); ++i) {
            hashes_field_elements[i] = field_type::value_type::zero();
        }

        field_type::value_type hash =
            Hmac::get_hmac(secret_bv, std::vector<bool>(circuit::HASH_MSG_LEN, 1)) [0];
        field_type::value_type anonymous_id =
            Hmac::get_hmac(secret_bv, std::vector<bool>(circuit::ANONYMOUS_ID_MSG_LEN, 1)) [0];
        
        std::vector<bool> vote_choice_bv(circuit::VOTE_MSG_LEN);

        for(std::size_t i = 0, temp = vote_choice; i < circuit::VOTE_MSG_LEN; ++i) {
            vote_choice_bv[i] = temp&1;
            temp >>= 1;
        }

        field_type::value_type vote_choice_hmac =
            Hmac::get_hmac(secret_bv, vote_choice_bv) [0];

        std::size_t index = 
            std::find(hashes_field_elements.begin(),
                      hashes_field_elements.end(),
                      hash) - hashes_field_elements.begin();

        if(index < 0 ) {
            std::cout << "The voting secret's hash is not in the voters hashes list" << std::endl;
            return 1;
        }
        

        bp = circuit::generate_circuit_with_witness<field_type>(
            hashes_field_elements,
            secret_bv,
            vote_choice,
            index,
            vote_choice_hmac,
            anonymous_id
        );
        std::cout << "is blueprint satisfied:" << (bp.is_satisfied() ? "true" : "false") << std::endl;

        std::cout << "Your vote hmac is: " << field_element_to_hex(vote_choice_hmac) << std::endl;        
        std::cout << "Your anonymous voter id is: " << field_element_to_hex(anonymous_id) << std::endl;

    }
    
    typename scheme_type::proving_key_type proving_key;
    if (vm.count("generate-keypair")) {
        std::cout << "Starting generator" << std::endl;
        zk::snark::r1cs_constraint_system<field_type> constraint_system =
            bp.get_constraint_system();
        std::cout << constraint_system.num_constraints() << std::endl;
        std::cout << constraint_system.num_variables() << std::endl;
        typename scheme_type::keypair_type keypair =
             zk::snark::generate<scheme_type>(constraint_system);
        std::vector<std::uint8_t> verification_key_byteblob =
            serializer_tvm::process(keypair.second);
        write_vector_to_disk(vkout, verification_key_byteblob);
        
        std::vector<std::uint8_t> proving_key_byteblob =
            serializer_tvm::process(keypair.first);
        write_vector_to_disk(pkout, proving_key_byteblob);

        proving_key=keypair.first;
    } else {
        std::cout << "Loading proving key" << std::endl;
        std::vector<uint8_t> proving_key_byteblob = read_vector_from_disk(pkin);
        nil::marshalling::status_type pk_desrialize_status;
        proving_key =
             deserializer_tvm::proving_key_process(proving_key_byteblob.begin(),
                                                   proving_key_byteblob.end(),
                                                   pk_desrialize_status);

        if(pk_desrialize_status != nil::marshalling::status_type::success) {
            std::cerr << "Error: Could not deserialize proving key" << std::endl;
            std::cerr << "Status is:" << static_cast<int>(pk_desrialize_status) << std::endl;
            return 1;
        }
    }

    if (vm.count("prove")) {
        std::cout << "is blueprint satisfied:" << (bp.is_satisfied() ? "true" : "false") << std::endl;

        std::cout << "Starting prover" << std::endl;

        const typename scheme_type::proof_type proof =
            zk::snark::prove<scheme_type>(proving_key, bp.primary_input(), bp.auxiliary_input());
        std::vector<std::uint8_t> proof_byteblob =
            serializer_tvm::process(proof);
        boost::filesystem::ofstream poutf(pout);
        for (const auto &v : proof_byteblob) {
            poutf << v;
        }
        poutf.close();
    }

    return 0;
}
