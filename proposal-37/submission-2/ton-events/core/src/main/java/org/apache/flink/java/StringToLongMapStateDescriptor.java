package org.apache.flink.java;

import org.apache.flink.api.common.state.MapStateDescriptor;
import org.apache.flink.api.common.typeinfo.TypeInformation;


/**
 * StringToLongMapStateDescriptor
 */
public class StringToLongMapStateDescriptor extends MapStateDescriptor<String, Long> {
    public StringToLongMapStateDescriptor(String name) {
        super(name, TypeInformation.of(String.class), TypeInformation.of(Long.class));
    }
}

