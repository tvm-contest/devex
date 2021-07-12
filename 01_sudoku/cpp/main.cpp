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

//#include "detail/r1cs_examples.hpp"
//#include "detail/sha256_component.hpp"

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

#include <nil/marshalling/status_type.hpp>

#include "sudoku.hpp"
#include "sudoku.cpp"

#include <vector>

using namespace nil::crypto3;
using namespace nil::crypto3::zk;

typedef algebra::curves::bls12<381> curve_type;
typedef typename curve_type::scalar_field_type field_type;

typedef zk::snark::r1cs_gg_ppzksnark<curve_type> scheme_type;

int main(int argc, char *argv[]) {
    boost::filesystem::path pout, pkout, vkout;
    boost::program_options::options_description options(
        "R1CS Generic Group PreProcessing Zero-Knowledge Succinct Non-interactive ARgument of Knowledge "
        "(https://eprint.iacr.org/2016/260.pdf) CLI Proof Generator");
    // clang-format off
    options.add_options()("help,h", "Display help message")
    // ("version,v", "Display version")
      ("sudoku-generate-keys", "Generate Sudoku keys")
      ("sudoku-verify-proof", "verify Sudoku proof")
      ("sudoku-generate-proof","generate Sudoku proof for one solved instance");
    // ("proof-output,po", boost::program_options::value<boost::filesystem::path>(&pout)->default_value("proof"))
    // ("proving-key-output,pko", boost::program_options::value<boost::filesystem::path>(&pkout)->default_value("pkey"))
    // ("verifying-key-output,vko", boost::program_options::value<boost::filesystem::path>(&vkout)->default_value("vkey"));
    // clang-format on

    boost::program_options::variables_map vm;
    boost::program_options::store(boost::program_options::command_line_parser(argc, argv).options(options).run(), vm);
    boost::program_options::notify(vm);

    if (vm.count("help") || argc < 2) {
        std::cout << options << std::endl;
        return 0;
    }

    if (vm.count("sudoku-generate-keys")) {
        generate_keys();
    };

    if (vm.count("sudoku-verify-proof")){
    };

    if (vm.count("sudoku-generate-proof")) {
      std::string instance_filename = "simple_instance.in";
      std::string solution_filename = "solved_instance.in";
      // std::cout << "Please input the sudoku instance (default is in file instance.in)" << std::endl;
      // std::cin >> instance_filename;
      std::vector<int> sudoku_instance = input_instance(instance_filename);
      // std::cout << "Please input the sudoku solved instance (default is in file solved_instance.in)" << std::endl;
      // std::cin >> solution_filename;
      std::vector<int> sudoku_solution = input_solved(solution_filename);
      prove(sudoku_instance, sudoku_solution);

    }

    return 0;
}
