import options from 'options';

const IntParamForm = ({ paramObject }) => {
    const [minValue, setMinValue] = React.useState(0);
    const [maxValue, setMaxValue] = React.useState(100);
    const [isRequired, setIsRequired] = React.useState(true);

    paramObject.properties = {
        type: options.Integer,
        minValue: minValue,
        maxValue: maxValue,
        isRequired: isRequired
    };

    const minValueChange = (e) => {
        setMinValue(e.target.value);
        paramObject.properties.minLength = minValue;
    };

    const maxValueChange = (e) => {
        setMaxValue(e.target.value);
        paramObject.properties.maxLength = maxValue;
    };

    const isRequiredChange = (e) => {
        setIsRequired(e.target.checked);
        paramObject.properties.isRequired = isRequired;
    };

    return (
        <div>
            <div className='param-form-input'>
                <label className='text-dark'>Min value</label>
                <input 
                    className='form-control'
                    type='number'
                    placeholder='Enter min value'
                    value={minValue}
                    onChange={minValueChange}
                />
            </div>

            <div className='param-form-input'>
                <label className='text-dark'>Max value</label>
                <input 
                    className='form-control'
                    type='number'
                    placeholder='Enter max value'
                    value={maxValue}
                    onChange={maxValueChange}
                />
            </div>

            <div className='last-in-form'>
                <input 
                    type='checkbox'
                    checked={isRequired}
                    onChange={isRequiredChange}
                />
                <label className='text-dark'>Is Require</label>
            </div>
        </div>
    );
};

export default IntParamForm;