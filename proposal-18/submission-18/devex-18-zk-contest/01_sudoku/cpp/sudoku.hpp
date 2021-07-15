//---------------------------------------------------------------------------//
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
//---------------------------------------------------------------------------//

#ifndef CRYPTO3_BLUEPRINT_SUDOKU_TEST_COMPONENT_HPP
#define CRYPTO3_BLUEPRINT_SUDOKU_TEST_COMPONENT_HPP

#include <nil/crypto3/zk/components/component.hpp>

#include <nil/crypto3/zk/components/blueprint.hpp>
#include <nil/crypto3/zk/components/blueprint_variable.hpp>
// #include <nil/crypto3/zk/snark/components/basic_components.hpp>

#include <nil/crypto3/zk/snark/relations/constraint_satisfaction_problems/r1cs.hpp>


using namespace nil::crypto3;
using namespace nil::crypto3::zk;
using namespace nil::crypto3::zk::components;
using namespace nil::crypto3::algebra;
using namespace nil::crypto3::zk::snark;

template<typename FieldType>
class test_component : public nil::crypto3::zk::components::component<FieldType> {
    using field_type = FieldType;
    //private (intermediary) variables

    blueprint_variable<field_type> aux_55;
    blueprint_variable<field_type> aux_54;
    blueprint_variable<field_type> aux_53;
    blueprint_variable<field_type> aux_52;
    blueprint_variable<field_type> aux_51;
    blueprint_variable<field_type> aux_50;
    blueprint_variable<field_type> aux_49;
    blueprint_variable<field_type> aux_48;
    blueprint_variable<field_type> aux_47;
    blueprint_variable<field_type> aux_46;
    blueprint_variable<field_type> aux_45;
    blueprint_variable<field_type> aux_44;
    blueprint_variable<field_type> aux_43;
    blueprint_variable<field_type> aux_42;
    blueprint_variable<field_type> aux_41;
    blueprint_variable<field_type> aux_40;
    blueprint_variable<field_type> aux_39;
    blueprint_variable<field_type> aux_38;
    blueprint_variable<field_type> aux_37;
    blueprint_variable<field_type> aux_36;
    blueprint_variable<field_type> aux_35;
    blueprint_variable<field_type> aux_34;
    blueprint_variable<field_type> aux_33;
    blueprint_variable<field_type> aux_32;
    blueprint_variable<field_type> aux_31;
    blueprint_variable<field_type> aux_30;
    blueprint_variable<field_type> aux_29;
    blueprint_variable<field_type> aux_28;
    blueprint_variable<field_type> aux_27;
    blueprint_variable<field_type> aux_26;
    blueprint_variable<field_type> aux_25;
    blueprint_variable<field_type> aux_24;
    blueprint_variable<field_type> aux_23;
    blueprint_variable<field_type> aux_22;
    blueprint_variable<field_type> aux_21;
    blueprint_variable<field_type> aux_20;
    blueprint_variable<field_type> aux_19;
    blueprint_variable<field_type> aux_18;
    blueprint_variable<field_type> aux_17;
    blueprint_variable<field_type> aux_16;
    blueprint_variable<field_type> aux_15;
    blueprint_variable<field_type> aux_14;
    blueprint_variable<field_type> aux_13;
    blueprint_variable<field_type> aux_12;
    blueprint_variable<field_type> aux_11;
    blueprint_variable<field_type> aux_10;
    blueprint_variable<field_type> aux_9;
    blueprint_variable<field_type> aux_8;
    blueprint_variable<field_type> aux_7;
    blueprint_variable<field_type> aux_6;
    blueprint_variable<field_type> aux_5;
    blueprint_variable<field_type> aux_4;
    blueprint_variable<field_type> aux_3;
    blueprint_variable<field_type> aux_2;
    blueprint_variable<field_type> aux_1;
    blueprint_variable<field_type> aux_0;
    blueprint_variable<field_type> free2_x_0_0;
    blueprint_variable<field_type> free2_x_0_1;
    blueprint_variable<field_type> free2_x_0_2;
    blueprint_variable<field_type> free2_x_0_3;
    blueprint_variable<field_type> free2_x_1_0;
    blueprint_variable<field_type> free2_x_1_1;
    blueprint_variable<field_type> free2_x_1_2;
    blueprint_variable<field_type> free2_x_1_3;
    blueprint_variable<field_type> free2_x_2_0;
    blueprint_variable<field_type> free2_x_2_1;
    blueprint_variable<field_type> free2_x_2_2;
    blueprint_variable<field_type> free2_x_2_3;
    blueprint_variable<field_type> free2_x_3_0;
    blueprint_variable<field_type> free2_x_3_1;
    blueprint_variable<field_type> free2_x_3_2;
    blueprint_variable<field_type> free2_x_3_3;

    //blueprint_variable<field_type> sym_1;
    //blueprint_variable<field_type> y;
    //blueprint_variable<field_type> sym_2;
public:
    //public variables

    const blueprint_variable<field_type> free_x_0_0;
    const blueprint_variable<field_type> free_x_0_1;
    const blueprint_variable<field_type> free_x_0_2;
    const blueprint_variable<field_type> free_x_0_3;
    const blueprint_variable<field_type> free_x_1_0;
    const blueprint_variable<field_type> free_x_1_1;
    const blueprint_variable<field_type> free_x_1_2;
    const blueprint_variable<field_type> free_x_1_3;
    const blueprint_variable<field_type> free_x_2_0;
    const blueprint_variable<field_type> free_x_2_1;
    const blueprint_variable<field_type> free_x_2_2;
    const blueprint_variable<field_type> free_x_2_3;
    const blueprint_variable<field_type> free_x_3_0;
    const blueprint_variable<field_type> free_x_3_1;
    const blueprint_variable<field_type> free_x_3_2;
    const blueprint_variable<field_type> free_x_3_3;

    const blueprint_variable<field_type> x_0_0;
    const blueprint_variable<field_type> x_0_1;
    const blueprint_variable<field_type> x_0_2;
    const blueprint_variable<field_type> x_0_3;
    const blueprint_variable<field_type> x_1_0;
    const blueprint_variable<field_type> x_1_1;
    const blueprint_variable<field_type> x_1_2;
    const blueprint_variable<field_type> x_1_3;
    const blueprint_variable<field_type> x_2_0;
    const blueprint_variable<field_type> x_2_1;
    const blueprint_variable<field_type> x_2_2;
    const blueprint_variable<field_type> x_2_3;
    const blueprint_variable<field_type> x_3_0;
    const blueprint_variable<field_type> x_3_1;
    const blueprint_variable<field_type> x_3_2;
    const blueprint_variable<field_type> x_3_3;

    //const blueprint_variable<field_type> out;
    //const blueprint_variable<field_type> x;

    test_component(blueprint<field_type> &bp,
 const blueprint_variable<field_type> &free_x_0_0,
 const blueprint_variable<field_type> &free_x_0_1,
 const blueprint_variable<field_type> &free_x_0_2,
 const blueprint_variable<field_type> &free_x_0_3,
 const blueprint_variable<field_type> &free_x_1_0,
 const blueprint_variable<field_type> &free_x_1_1,
 const blueprint_variable<field_type> &free_x_1_2,
 const blueprint_variable<field_type> &free_x_1_3,
 const blueprint_variable<field_type> &free_x_2_0,
 const blueprint_variable<field_type> &free_x_2_1,
 const blueprint_variable<field_type> &free_x_2_2,
 const blueprint_variable<field_type> &free_x_2_3,
 const blueprint_variable<field_type> &free_x_3_0,
 const blueprint_variable<field_type> &free_x_3_1,
 const blueprint_variable<field_type> &free_x_3_2,
 const blueprint_variable<field_type> &free_x_3_3,
 const blueprint_variable<field_type> &x_0_0,
 const blueprint_variable<field_type> &x_0_1,
 const blueprint_variable<field_type> &x_0_2,
 const blueprint_variable<field_type> &x_0_3,
 const blueprint_variable<field_type> &x_1_0,
 const blueprint_variable<field_type> &x_1_1,
 const blueprint_variable<field_type> &x_1_2,
 const blueprint_variable<field_type> &x_1_3,
 const blueprint_variable<field_type> &x_2_0,
 const blueprint_variable<field_type> &x_2_1,
 const blueprint_variable<field_type> &x_2_2,
 const blueprint_variable<field_type> &x_2_3,
 const blueprint_variable<field_type> &x_3_0,
 const blueprint_variable<field_type> &x_3_1,
 const blueprint_variable<field_type> &x_3_2,
 const blueprint_variable<field_type> &x_3_3

                //const blueprint_variable<field_type> &out,
                //const blueprint_variable<field_type> &x
 ) :
      nil::crypto3::zk::components::component<field_type>(bp) ,free_x_0_0 (free_x_0_0),free_x_0_1 (free_x_0_1),free_x_0_2 (free_x_0_2),free_x_0_3 (free_x_0_3),free_x_1_0 (free_x_1_0),free_x_1_1 (free_x_1_1),free_x_1_2 (free_x_1_2),free_x_1_3 (free_x_1_3),free_x_2_0 (free_x_2_0),free_x_2_1 (free_x_2_1),free_x_2_2 (free_x_2_2),free_x_2_3 (free_x_2_3),free_x_3_0 (free_x_3_0),free_x_3_1 (free_x_3_1),free_x_3_2 (free_x_3_2),free_x_3_3 (free_x_3_3), x_0_0 (x_0_0),x_0_1 (x_0_1),x_0_2 (x_0_2),x_0_3 (x_0_3),x_1_0 (x_1_0),x_1_1 (x_1_1),x_1_2 (x_1_2),x_1_3 (x_1_3),x_2_0 (x_2_0),x_2_1 (x_2_1),x_2_2 (x_2_2),x_2_3 (x_2_3),x_3_0 (x_3_0),x_3_1 (x_3_1),x_3_2 (x_3_2),x_3_3 (x_3_3) {

      // Allocate variables to blueprint
      //allocate private variables to blueprint
    aux_55.allocate(this->bp);
    aux_54.allocate(this->bp);
    aux_53.allocate(this->bp);
    aux_52.allocate(this->bp);
    aux_51.allocate(this->bp);
    aux_50.allocate(this->bp);
    aux_49.allocate(this->bp);
    aux_48.allocate(this->bp);
    aux_47.allocate(this->bp);
    aux_46.allocate(this->bp);
    aux_45.allocate(this->bp);
    aux_44.allocate(this->bp);
    aux_43.allocate(this->bp);
    aux_42.allocate(this->bp);
    aux_41.allocate(this->bp);
    aux_40.allocate(this->bp);
    aux_39.allocate(this->bp);
    aux_38.allocate(this->bp);
    aux_37.allocate(this->bp);
    aux_36.allocate(this->bp);
    aux_35.allocate(this->bp);
    aux_34.allocate(this->bp);
    aux_33.allocate(this->bp);
    aux_32.allocate(this->bp);
    aux_31.allocate(this->bp);
    aux_30.allocate(this->bp);
    aux_29.allocate(this->bp);
    aux_28.allocate(this->bp);
    aux_27.allocate(this->bp);
    aux_26.allocate(this->bp);
    aux_25.allocate(this->bp);
    aux_24.allocate(this->bp);
    aux_23.allocate(this->bp);
    aux_22.allocate(this->bp);
    aux_21.allocate(this->bp);
    aux_20.allocate(this->bp);
    aux_19.allocate(this->bp);
    aux_18.allocate(this->bp);
    aux_17.allocate(this->bp);
    aux_16.allocate(this->bp);
    aux_15.allocate(this->bp);
    aux_14.allocate(this->bp);
    aux_13.allocate(this->bp);
    aux_12.allocate(this->bp);
    aux_11.allocate(this->bp);
    aux_10.allocate(this->bp);
    aux_9.allocate(this->bp);
    aux_8.allocate(this->bp);
    aux_7.allocate(this->bp);
    aux_6.allocate(this->bp);
    aux_5.allocate(this->bp);
    aux_4.allocate(this->bp);
    aux_3.allocate(this->bp);
    aux_2.allocate(this->bp);
    aux_1.allocate(this->bp);
    aux_0.allocate(this->bp);
    /*x_0_0.allocate(this->bp);
    x_0_1.allocate(this->bp);
    x_0_2.allocate(this->bp);
    x_0_3.allocate(this->bp);
    x_1_0.allocate(this->bp);
    x_1_1.allocate(this->bp);
    x_1_2.allocate(this->bp);
    x_1_3.allocate(this->bp);
    x_2_0.allocate(this->bp);
    x_2_1.allocate(this->bp);
    x_2_2.allocate(this->bp);
    x_2_3.allocate(this->bp);
    x_3_0.allocate(this->bp);
    x_3_1.allocate(this->bp);
    x_3_2.allocate(this->bp);
    x_3_3.allocate(this->bp);*/
    free2_x_0_0.allocate(this->bp);
    free2_x_0_1.allocate(this->bp);
    free2_x_0_2.allocate(this->bp);
    free2_x_0_3.allocate(this->bp);
    free2_x_1_0.allocate(this->bp);
    free2_x_1_1.allocate(this->bp);
    free2_x_1_2.allocate(this->bp);
    free2_x_1_3.allocate(this->bp);
    free2_x_2_0.allocate(this->bp);
    free2_x_2_1.allocate(this->bp);
    free2_x_2_2.allocate(this->bp);
    free2_x_2_3.allocate(this->bp);
    free2_x_3_0.allocate(this->bp);
    free2_x_3_1.allocate(this->bp);
    free2_x_3_2.allocate(this->bp);
    free2_x_3_3.allocate(this->bp);

      //sym_1.allocate(this->bp);
      //y.allocate(this->bp);
      //sym_2.allocate(this->bp);
    }

    void generate_r1cs_constraints() {

  this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(free_x_0_0, x_0_0, free2_x_0_0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(free_x_0_1, x_0_1, free2_x_0_1));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(free_x_0_2, x_0_2, free2_x_0_2));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(free_x_0_3, x_0_3, free2_x_0_3));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(free_x_1_0, x_1_0, free2_x_1_0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(free_x_1_1, x_1_1, free2_x_1_1));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(free_x_1_2, x_1_2, free2_x_1_2));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(free_x_1_3, x_1_3, free2_x_1_3));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(free_x_2_0, x_2_0, free2_x_2_0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(free_x_2_1, x_2_1, free2_x_2_1));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(free_x_2_2, x_2_2, free2_x_2_2));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(free_x_2_3, x_2_3, free2_x_2_3));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(free_x_3_0, x_3_0, free2_x_3_0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(free_x_3_1, x_3_1, free2_x_3_1));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(free_x_3_2, x_3_2, free2_x_3_2));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(free_x_3_3, x_3_3, free2_x_3_3));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>((x_3_3+(-1) * (1)), (x_3_3+(-2) * (1)), aux_0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_0, (x_3_3+(-3) * (1)), aux_1));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_1, (x_3_3+(-4) * (1)), 0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>((x_3_2+(-1) * (1)), (x_3_2+(-2) * (1)), aux_2));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_2, (x_3_2+(-3) * (1)), aux_3));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_3, (x_3_2+(-4) * (1)), 0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>((x_3_1+(-1) * (1)), (x_3_1+(-2) * (1)), aux_4));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_4, (x_3_1+(-3) * (1)), aux_5));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_5, (x_3_1+(-4) * (1)), 0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>((x_3_0+(-1) * (1)), (x_3_0+(-2) * (1)), aux_6));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_6, (x_3_0+(-3) * (1)), aux_7));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_7, (x_3_0+(-4) * (1)), 0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>((x_2_3+(-1) * (1)), (x_2_3+(-2) * (1)), aux_8));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_8, (x_2_3+(-3) * (1)), aux_9));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_9, (x_2_3+(-4) * (1)), 0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>((x_2_2+(-1) * (1)), (x_2_2+(-2) * (1)), aux_10));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_10, (x_2_2+(-3) * (1)), aux_11));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_11, (x_2_2+(-4) * (1)), 0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>((x_2_1+(-1) * (1)), (x_2_1+(-2) * (1)), aux_12));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_12, (x_2_1+(-3) * (1)), aux_13));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_13, (x_2_1+(-4) * (1)), 0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>((x_2_0+(-1) * (1)), (x_2_0+(-2) * (1)), aux_14));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_14, (x_2_0+(-3) * (1)), aux_15));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_15, (x_2_0+(-4) * (1)), 0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>((x_1_3+(-1) * (1)), (x_1_3+(-2) * (1)), aux_16));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_16, (x_1_3+(-3) * (1)), aux_17));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_17, (x_1_3+(-4) * (1)), 0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>((x_1_2+(-1) * (1)), (x_1_2+(-2) * (1)), aux_18));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_18, (x_1_2+(-3) * (1)), aux_19));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_19, (x_1_2+(-4) * (1)), 0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>((x_1_1+(-1) * (1)), (x_1_1+(-2) * (1)), aux_20));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_20, (x_1_1+(-3) * (1)), aux_21));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_21, (x_1_1+(-4) * (1)), 0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>((x_1_0+(-1) * (1)), (x_1_0+(-2) * (1)), aux_22));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_22, (x_1_0+(-3) * (1)), aux_23));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_23, (x_1_0+(-4) * (1)), 0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>((x_0_3+(-1) * (1)), (x_0_3+(-2) * (1)), aux_24));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_24, (x_0_3+(-3) * (1)), aux_25));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_25, (x_0_3+(-4) * (1)), 0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>((x_0_2+(-1) * (1)), (x_0_2+(-2) * (1)), aux_26));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_26, (x_0_2+(-3) * (1)), aux_27));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_27, (x_0_2+(-4) * (1)), 0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>((x_0_1+(-1) * (1)), (x_0_1+(-2) * (1)), aux_28));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_28, (x_0_1+(-3) * (1)), aux_29));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_29, (x_0_1+(-4) * (1)), 0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>((x_0_0+(-1) * (1)), (x_0_0+(-2) * (1)), aux_30));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_30, (x_0_0+(-3) * (1)), aux_31));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_31, (x_0_0+(-4) * (1)), 0));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(x_2_2, x_2_3, aux_32));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_32, x_3_2, aux_33));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_33, x_3_3, (24) * (1)));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(x_2_0, x_2_1, aux_34));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_34, x_3_0, aux_35));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_35, x_3_1, (24) * (1)));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(x_0_2, x_0_3, aux_36));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_36, x_1_2, aux_37));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_37, x_1_3, (24) * (1)));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(x_0_0, x_0_1, aux_38));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_38, x_1_0, aux_39));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_39, x_1_1, (24) * (1)));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(x_0_3, x_1_3, aux_40));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_40, x_2_3, aux_41));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_41, x_3_3, (24) * (1)));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(x_0_2, x_1_2, aux_42));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_42, x_2_2, aux_43));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_43, x_3_2, (24) * (1)));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(x_0_1, x_1_1, aux_44));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_44, x_2_1, aux_45));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_45, x_3_1, (24) * (1)));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(x_0_0, x_1_0, aux_46));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_46, x_2_0, aux_47));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_47, x_3_0, (24) * (1)));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(x_3_0, x_3_1, aux_48));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_48, x_3_2, aux_49));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_49, x_3_3, (24) * (1)));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(x_2_0, x_2_1, aux_50));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_50, x_2_2, aux_51));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_51, x_2_3, (24) * (1)));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(x_1_0, x_1_1, aux_52));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_52, x_1_2, aux_53));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_53, x_1_3, (24) * (1)));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(x_0_0, x_0_1, aux_54));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_54, x_0_2, aux_55));
      this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(aux_55, x_0_3, (24) * (1)));

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

  this->bp.val(aux_54) = (this->bp.val(x_0_0)) * (this->bp.val(x_0_1));
      this->bp.val(aux_55) = (this->bp.val(aux_54)) * (this->bp.val(x_0_2));
      this->bp.val(aux_52) = (this->bp.val(x_1_0)) * (this->bp.val(x_1_1));
      this->bp.val(aux_53) = (this->bp.val(aux_52)) * (this->bp.val(x_1_2));
      this->bp.val(aux_50) = (this->bp.val(x_2_0)) * (this->bp.val(x_2_1));
      this->bp.val(aux_51) = (this->bp.val(aux_50)) * (this->bp.val(x_2_2));
      this->bp.val(aux_48) = (this->bp.val(x_3_0)) * (this->bp.val(x_3_1));
      this->bp.val(aux_49) = (this->bp.val(aux_48)) * (this->bp.val(x_3_2));
      this->bp.val(aux_46) = (this->bp.val(x_0_0)) * (this->bp.val(x_1_0));
      this->bp.val(aux_47) = (this->bp.val(aux_46)) * (this->bp.val(x_2_0));
      this->bp.val(aux_44) = (this->bp.val(x_0_1)) * (this->bp.val(x_1_1));
      this->bp.val(aux_45) = (this->bp.val(aux_44)) * (this->bp.val(x_2_1));
      this->bp.val(aux_42) = (this->bp.val(x_0_2)) * (this->bp.val(x_1_2));
      this->bp.val(aux_43) = (this->bp.val(aux_42)) * (this->bp.val(x_2_2));
      this->bp.val(aux_40) = (this->bp.val(x_0_3)) * (this->bp.val(x_1_3));
      this->bp.val(aux_41) = (this->bp.val(aux_40)) * (this->bp.val(x_2_3));
      this->bp.val(aux_38) = (this->bp.val(x_0_0)) * (this->bp.val(x_0_1));
      this->bp.val(aux_39) = (this->bp.val(aux_38)) * (this->bp.val(x_1_0));
      this->bp.val(aux_36) = (this->bp.val(x_0_2)) * (this->bp.val(x_0_3));
      this->bp.val(aux_37) = (this->bp.val(aux_36)) * (this->bp.val(x_1_2));
      this->bp.val(aux_34) = (this->bp.val(x_2_0)) * (this->bp.val(x_2_1));
      this->bp.val(aux_35) = (this->bp.val(aux_34)) * (this->bp.val(x_3_0));
      this->bp.val(aux_32) = (this->bp.val(x_2_2)) * (this->bp.val(x_2_3));
      this->bp.val(aux_33) = (this->bp.val(aux_32)) * (this->bp.val(x_3_2));
      this->bp.val(aux_30) = ((this->bp.val(x_0_0)+(-1) * (1))) * ((this->bp.val(x_0_0)+(-2) * (1)));
      this->bp.val(aux_31) = (this->bp.val(aux_30)) * ((this->bp.val(x_0_0)+(-3) * (1)));
      this->bp.val(aux_28) = ((this->bp.val(x_0_1)+(-1) * (1))) * ((this->bp.val(x_0_1)+(-2) * (1)));
      this->bp.val(aux_29) = (this->bp.val(aux_28)) * ((this->bp.val(x_0_1)+(-3) * (1)));
      this->bp.val(aux_26) = ((this->bp.val(x_0_2)+(-1) * (1))) * ((this->bp.val(x_0_2)+(-2) * (1)));
      this->bp.val(aux_27) = (this->bp.val(aux_26)) * ((this->bp.val(x_0_2)+(-3) * (1)));
      this->bp.val(aux_24) = ((this->bp.val(x_0_3)+(-1) * (1))) * ((this->bp.val(x_0_3)+(-2) * (1)));
      this->bp.val(aux_25) = (this->bp.val(aux_24)) * ((this->bp.val(x_0_3)+(-3) * (1)));
      this->bp.val(aux_22) = ((this->bp.val(x_1_0)+(-1) * (1))) * ((this->bp.val(x_1_0)+(-2) * (1)));
      this->bp.val(aux_23) = (this->bp.val(aux_22)) * ((this->bp.val(x_1_0)+(-3) * (1)));
      this->bp.val(aux_20) = ((this->bp.val(x_1_1)+(-1) * (1))) * ((this->bp.val(x_1_1)+(-2) * (1)));
      this->bp.val(aux_21) = (this->bp.val(aux_20)) * ((this->bp.val(x_1_1)+(-3) * (1)));
      this->bp.val(aux_18) = ((this->bp.val(x_1_2)+(-1) * (1))) * ((this->bp.val(x_1_2)+(-2) * (1)));
      this->bp.val(aux_19) = (this->bp.val(aux_18)) * ((this->bp.val(x_1_2)+(-3) * (1)));
      this->bp.val(aux_16) = ((this->bp.val(x_1_3)+(-1) * (1))) * ((this->bp.val(x_1_3)+(-2) * (1)));
      this->bp.val(aux_17) = (this->bp.val(aux_16)) * ((this->bp.val(x_1_3)+(-3) * (1)));
      this->bp.val(aux_14) = ((this->bp.val(x_2_0)+(-1) * (1))) * ((this->bp.val(x_2_0)+(-2) * (1)));
      this->bp.val(aux_15) = (this->bp.val(aux_14)) * ((this->bp.val(x_2_0)+(-3) * (1)));
      this->bp.val(aux_12) = ((this->bp.val(x_2_1)+(-1) * (1))) * ((this->bp.val(x_2_1)+(-2) * (1)));
      this->bp.val(aux_13) = (this->bp.val(aux_12)) * ((this->bp.val(x_2_1)+(-3) * (1)));
      this->bp.val(aux_10) = ((this->bp.val(x_2_2)+(-1) * (1))) * ((this->bp.val(x_2_2)+(-2) * (1)));
      this->bp.val(aux_11) = (this->bp.val(aux_10)) * ((this->bp.val(x_2_2)+(-3) * (1)));
      this->bp.val(aux_8) = ((this->bp.val(x_2_3)+(-1) * (1))) * ((this->bp.val(x_2_3)+(-2) * (1)));
      this->bp.val(aux_9) = (this->bp.val(aux_8)) * ((this->bp.val(x_2_3)+(-3) * (1)));
      this->bp.val(aux_6) = ((this->bp.val(x_3_0)+(-1) * (1))) * ((this->bp.val(x_3_0)+(-2) * (1)));
      this->bp.val(aux_7) = (this->bp.val(aux_6)) * ((this->bp.val(x_3_0)+(-3) * (1)));
      this->bp.val(aux_4) = ((this->bp.val(x_3_1)+(-1) * (1))) * ((this->bp.val(x_3_1)+(-2) * (1)));
      this->bp.val(aux_5) = (this->bp.val(aux_4)) * ((this->bp.val(x_3_1)+(-3) * (1)));
      this->bp.val(aux_2) = ((this->bp.val(x_3_2)+(-1) * (1))) * ((this->bp.val(x_3_2)+(-2) * (1)));
      this->bp.val(aux_3) = (this->bp.val(aux_2)) * ((this->bp.val(x_3_2)+(-3) * (1)));
      this->bp.val(aux_0) = ((this->bp.val(x_3_3)+(-1) * (1))) * ((this->bp.val(x_3_3)+(-2) * (1)));
      this->bp.val(aux_1) = (this->bp.val(aux_0)) * ((this->bp.val(x_3_3)+(-3) * (1)));
      this->bp.val(free2_x_0_0) = (this->bp.val(free_x_0_0)) * (this->bp.val(free_x_0_0));
      this->bp.val(free2_x_0_1) = (this->bp.val(free_x_0_1)) * (this->bp.val(free_x_0_1));
      this->bp.val(free2_x_0_2) = (this->bp.val(free_x_0_2)) * (this->bp.val(free_x_0_2));
      this->bp.val(free2_x_0_3) = (this->bp.val(free_x_0_3)) * (this->bp.val(free_x_0_3));
      this->bp.val(free2_x_1_0) = (this->bp.val(free_x_1_0)) * (this->bp.val(free_x_1_0));
      this->bp.val(free2_x_1_1) = (this->bp.val(free_x_1_1)) * (this->bp.val(free_x_1_1));
      this->bp.val(free2_x_1_2) = (this->bp.val(free_x_1_2)) * (this->bp.val(free_x_1_2));
      this->bp.val(free2_x_1_3) = (this->bp.val(free_x_1_3)) * (this->bp.val(free_x_1_3));
      this->bp.val(free2_x_2_0) = (this->bp.val(free_x_2_0)) * (this->bp.val(free_x_2_0));
      this->bp.val(free2_x_2_1) = (this->bp.val(free_x_2_1)) * (this->bp.val(free_x_2_1));
      this->bp.val(free2_x_2_2) = (this->bp.val(free_x_2_2)) * (this->bp.val(free_x_2_2));
      this->bp.val(free2_x_2_3) = (this->bp.val(free_x_2_3)) * (this->bp.val(free_x_2_3));
      this->bp.val(free2_x_3_0) = (this->bp.val(free_x_3_0)) * (this->bp.val(free_x_3_0));
      this->bp.val(free2_x_3_1) = (this->bp.val(free_x_3_1)) * (this->bp.val(free_x_3_1));
      this->bp.val(free2_x_3_2) = (this->bp.val(free_x_3_2)) * (this->bp.val(free_x_3_2));
      this->bp.val(free2_x_3_3) = (this->bp.val(free_x_3_3)) * (this->bp.val(free_x_3_3));

      //this->bp.val(sym_1) = this->bp.val(x) * this->bp.val(x);
      //this->bp.val(y) = this->bp.val(sym_1) * this->bp.val(x);
      //this->bp.val(sym_2) = this->bp.val(y) + this->bp.val(x);
    }
};

#endif    // CRYPTO3_BLUEPRINT_SUDOKU_TEST_COMPONENT_HPP
