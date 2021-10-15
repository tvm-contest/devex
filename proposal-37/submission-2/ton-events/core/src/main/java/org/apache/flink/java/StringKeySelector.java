package org.apache.flink.java;

import org.apache.flink.api.java.functions.KeySelector;

/**
 * StringKeySelector
 */
public interface StringKeySelector<IN> extends KeySelector<IN, String> {}

