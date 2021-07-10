let license =
  {|//---------------------------------------------------------------------------//
// Copyright (c) 2018-2021 Mikhail Komarov <nemo@nil.foundation>
// Copyright (c) 2020-2021 Nikita Kaskov <nbering@nil.foundation>
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//---------------------------------------------------------------------------//|}

let big_fat_hpp
      ~name
      private_blueprint_variables_definition
      public_blueprint_variables_definition
      ~allocate_private_variables
      ~arguments_test_component
      ~arguments_test_component2
      ~equations
      ~r1cs_witness
  =
  let capital_name = String.uppercase_ascii name in
Printf.sprintf
{|%s

#ifndef CRYPTO3_BLUEPRINT_%s_TEST_COMPONENT_HPP
#define CRYPTO3_BLUEPRINT_%s_TEST_COMPONENT_HPP

#include <nil/crypto3/zk/snark/component.hpp>

#include <nil/crypto3/zk/snark/blueprint.hpp>
#include <nil/crypto3/zk/snark/blueprint_variable.hpp>
#include <nil/crypto3/zk/snark/components/basic_components.hpp>

#include <nil/crypto3/zk/snark/relations/constraint_satisfaction_problems/r1cs.hpp>

using namespace nil::crypto3::zk::snark;
using namespace nil::crypto3;
// using namespace nil::crypto3::algebra;

template<typename FieldType>
class test_component : public nil::crypto3::zk::snark::components::component<FieldType> {
    using field_type = FieldType;
    %s
    //blueprint_variable<field_type> sym_1;
    //blueprint_variable<field_type> y;
    //blueprint_variable<field_type> sym_2;
public:
    %s
    //const blueprint_variable<field_type> out;
    //const blueprint_variable<field_type> x;

    test_component(blueprint<field_type> &bp%s
                //const blueprint_variable<field_type> &out,
                //const blueprint_variable<field_type> &x
 ) :
      nil::crypto3::zk::snark::components::component<field_type>(bp) %s {

      // Allocate variables to blueprint
      %s
      //sym_1.allocate(this->bp);
      //y.allocate(this->bp);
      //sym_2.allocate(this->bp);
    }

    void generate_r1cs_constraints() {
      %s
      // x*x = sym_1
      //this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(x, x, sym_1));

      // sym_1 * x = y
      //this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(sym_1, x, y));

      // y + x = sym_2
      //this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(y + x, 1, sym_2));

      // sym_2 + 5 = ~out
      //this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(sym_2 + 5, 1, out));
    }

    void generate_r1cs_witness() {
      %s
      //this->bp.val(sym_1) = this->bp.val(x) * this->bp.val(x);
      //this->bp.val(y) = this->bp.val(sym_1) * this->bp.val(x);
      //this->bp.val(sym_2) = this->bp.val(y) + this->bp.val(x);
    }
};

#endif    // CRYPTO3_BLUEPRINT_%s_TEST_COMPONENT_HPP|}
license
capital_name
capital_name
private_blueprint_variables_definition
public_blueprint_variables_definition
arguments_test_component
arguments_test_component2
allocate_private_variables
equations
r1cs_witness
capital_name
