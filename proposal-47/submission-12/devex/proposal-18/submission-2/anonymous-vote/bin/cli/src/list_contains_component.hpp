#ifndef HASHLIST_CONTAINS_COMPONENTS
#define HASHLIST_CONTAINS_COMPONENTS

#include<nil/crypto3/zk/components/packing.hpp>
#include <nil/crypto3/zk/components/component.hpp>
#include <nil/crypto3/zk/components/blueprint.hpp>
#include <nil/crypto3/zk/components/blueprint_variable.hpp>

#include<boost/optional.hpp>

using namespace nil::crypto3::zk;
using namespace components;

template<typename FieldType>
class list_contains_component: component<FieldType> {
    std::size_t list_size;
    blueprint_variable_vector<FieldType> list;
    blueprint_variable<FieldType> value;
    blueprint_variable_vector<FieldType> index_mask;
public:
    list_contains_component(blueprint<FieldType> &bp,
                            std::size_t size,
                            const blueprint_variable_vector<FieldType> &list,
                            const blueprint_variable<FieldType> &value)
    : list_size(size), list(list), value(value), component<FieldType>(bp) {
        assert(size == list.size());
        assert(size > 0);
        index_mask.allocate(bp, list_size);
    }

    void generate_r1cs_constraints() {
        for(auto variable : index_mask) {
            generate_boolean_r1cs_constraint<FieldType>(this->bp, variable);
        }
        this->bp.add_r1cs_constraint(
            snark::r1cs_constraint<FieldType>(1,blueprint_sum<FieldType>(index_mask),1));
        for(std::size_t i = 0; i < list_size; ++i) {
            this->bp.add_r1cs_constraint(snark::r1cs_constraint<FieldType>(index_mask[i], list[i] - value, 0));
        }
    }

    void generate_r1cs_witness(std::size_t index) {
        assert(index < list_size);
        for(std::size_t i = 0; i < list_size; ++i) {
            this->bp.val(index_mask[i]) = (i == index ?
                FieldType::value_type::one() :
                FieldType::value_type::zero());
        }
    }
};
#endif