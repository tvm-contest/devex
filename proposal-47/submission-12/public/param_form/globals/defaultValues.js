const defaultValues = {
    integer: {
        isRequired: true,
        minValue: 0,
        maxValue: 100
    },

    string: {
        isRequired: true,
        minLength: 1,
        maxLength: 256
    }
};

export default defaultValues;