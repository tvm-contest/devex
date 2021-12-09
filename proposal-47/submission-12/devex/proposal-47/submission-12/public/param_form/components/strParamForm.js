import options from 'options';

const StrParamForm = ({ paramObject }) => {
    const [minLength, setMinLength] = React.useState(1);
    const [maxLength, setMaxLength] = React.useState(256);
    const [isRequired, setIsRequired] = React.useState(true);

    paramObject.properties = {
        type: options.String,
        minLength: minLength,
        maxLength: maxLength,
        isRequired: isRequired
    };

    const minLengthChange = (e) => {
        setMinLength(e.target.value);
        paramObject.properties.minLength = minLength;
    };

    const maxLengthChange = (e) => {
        setMaxLength(e.target.value);
        paramObject.properties.maxLength = maxLength;
    };

    const isRequiredChange = (e) => {
        setIsRequired(e.target.checked);
        paramObject.properties.isRequired = isRequired;
    };

    return (
        <div>
            <div className='param-form-input'>
                <label className='text-dark'>Min length</label>
                <input 
                    className='form-control'
                    type='number'
                    value={minLength}
                    placeholder='Enter min length'
                    onChange={minLengthChange}
                />
            </div>

            <div className='param-form-input'>
                <label className='text-dark'>Max length</label>
                <input 
                    className='form-control'
                    type='number'
                    placeholder='Enter max length'
                    value={maxLength}
                    onChange={maxLengthChange}
                />
            </div>

            <div className='last-in-form'>
                <input 
                    type='checkbox'
                    checked={isRequired}
                    onChange={isRequiredChange}
                />
                <label className='text-dark'>Is require</label>
            </div>
        </div>
    );
};

export default StrParamForm;
