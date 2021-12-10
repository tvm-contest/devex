package org.apache.flink.java;

import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.api.common.typeinfo.TypeInformation;


/**
 * StringStateDescriptor
 */
public class StringStateDescriptor extends ValueStateDescriptor<String> {
    public StringStateDescriptor(String name) {
        super(name, TypeInformation.of(String.class));
    }
}

