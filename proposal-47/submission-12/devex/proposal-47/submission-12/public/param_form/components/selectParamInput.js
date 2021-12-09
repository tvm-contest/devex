import options from 'options';
import ParamFormRenderService from 'paramFormRender';

const SelectParamInput = ({ paramObject }) => {
    const [currentParamOption, setCurrentParamOption] = React.useState('');
    const paramRenderService = new ParamFormRenderService();

    const setParamType = (e) => {
        paramObject.properties = {};
        setCurrentParamOption(e.target.value);
    };

    return (
        <div className='select-param-body'>
            <label className='text-dark'>Choose parameter type</label>
            <select className='param-select' onChange={setParamType}>
                <option>Choose parameter type</option>
                {Object.values(options).map((option) => (
                    <option value={option}  key={option}>
                        {option}
                    </option>
                ))}
            </select> 

            {paramRenderService.render(currentParamOption, paramObject)}
        </div>
    );
};

export default SelectParamInput;