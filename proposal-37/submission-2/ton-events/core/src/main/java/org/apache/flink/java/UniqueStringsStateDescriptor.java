package org.apache.flink.java;

import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.api.common.typeinfo.TypeInformation;


/**
 * UniqueStringsStateDescriptor
 */
public class UniqueStringsStateDescriptor extends ValueStateDescriptor<UniqueStrings> {
    public UniqueStringsStateDescriptor(String name) {
        super(name, TypeInformation.of(UniqueStrings.class));
    }
}

