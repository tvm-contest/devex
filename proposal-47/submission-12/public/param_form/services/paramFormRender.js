import options from 'options';
import IntParamForm from 'intParamForm';
import StrParamForm from 'strParamForm';

export default class ParamFormRenderService {
    render(paramOption, paramObject) {
        if (paramOption === options.Integer) {
            return <IntParamForm paramObject={paramObject} />;
        }

        if (paramOption === options.String) {
            return <StrParamForm paramObject={paramObject} />;
        }

        return <div />;
    }
};