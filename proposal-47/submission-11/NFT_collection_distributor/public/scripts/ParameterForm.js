import '/stylesheets/styles';

class EnumOptions extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            enumVariants: [
            ]
        };
    
    this.handleAddEnumVariant = this.handleAddEnumVariant.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    }

    handleAddEnumVariant(e){
        e.preventDefault();
        let uid = Math.random(); 
            this.setState( prevState => ({
                enumVariants: [...prevState.enumVariants, {id:uid}]
            }));      
        
    }

    componentWillMount(){
        let uid = Math.random(); 
        this.setState( prevState => ({
            enumVariants: [...prevState.enumVariants, {id:uid}]
        })); 
    }

    handleDelete(parameter, event){
        event.preventDefault();
        this.setState(prevState => ({ enumVariants: prevState.enumVariants.filter(item => item.id !== parameter)     }));
    }

    render(){ 

        var rendered = []

        for (let i=0; i < this.state.enumVariants.length; i++) {
            rendered.push(
            <div>
            <label className='param-label'>Вариант перечисления:<input type="text" name="enumVairant" className="param_value" />
            <button onClick={(e) => this.handleDelete(this.state.enumVariants[i].id, e)}> {'\u2718'} </button></label>
            </div>
            )
          }

    return ( 
        <div>
        {rendered}
        <button onClick={this.handleAddEnumVariant} className="button"> Добавить вариант перечисления </button>
        <label className='param-label'><input name="isMandatory" type="checkbox" className="isMandatory"/> Обязательный параметр</label>
        <label className='param-label'><input name="isOnChain" type="checkbox" className="isOnChain"/> Хранить он-чейн</label>
        </div>
        );

}
}

export default class ParameterForm extends React.Component {

        constructor(props) {
            super(props);
            this.state = {
                defaultParamState: 'Не выбрано',
                parametersValues: '',
                params: []
            };
            this.handleChange = this.handleChange.bind(this);
            this.handleAdd = this.handleAdd.bind(this);
            this.addParameter = this.addParameter.bind(this);
        }

        addParameter(state) {
            switch (state) {
                case 'Целочисленное значение':
                    return ( 
                        <div>
                        <label className='param-label'>Минимальное значение:<input type="number" name="min value" className="param_value" /></label>
                        <label className='param-label'>Максимальное значение:<input type="number" name="max value" className="param_value" /></label>
                        <label className='param-label'><input name="isMandatory" type="checkbox" className="isMandatory"/> Обязательный параметр</label>
                        <label className='param-label'><input name="isOnChain" type="checkbox" className="isOnChain"/> Хранить он-чейн</label>
                        </div>
                    );
                    break;
                case 'Строка':
                    return ( 
                        <div>
                        <label className='param-label'>Минимальная длина:<input type="number" name="min length" className="param_value" /></label>
                        <label className='param-label'>Максимальная длина:<input type="number" name="max length" className="param_value" /></label>
                        <label className='param-label'><input name="isMandatory" type="checkbox" className="isMandatory"/> Обязательный параметр</label>
                        <label className='param-label'><input name="isOnChain" type="checkbox" className="isOnChain"/> Хранить он-чейн</label>
                        </div>
                    );
                    break;
                case 'Перечисление':
                    return ( 
                        <EnumOptions />
                        );
                    break;
                case 'Не выбрано':
                    return (<div> </div>);
                        break;
                    }
            }

            handleChange(event) {
                event.preventDefault();
                this.setState({
                        defaultParamState: event.target.value
                    }, () =>
                    this.setState({
                        parametersValues: this.addParameter(this.state.defaultParamState)
                    })
                )

            }

            handleAdd(event) {
                event.preventDefault();
                this.setState({
                    params: [...this.state.params, <Param /> ]
                })
            }

            handleDelete(event) {
                event.preventDefault();
                event.target.parentElement.remove()
            }

            render() {
                return ( 
                    <div>
                    <form className="parameterForm">
                    <p className="form-title">Параметры токенов</p>
                    {this.state.params}
                    <button onClick={this.handleAdd} className="button"> Добавить параметр </button>
                    </form>
                    </div>
                );
            }
        }

        class Param extends ParameterForm {
            render() {
                return ( 
                    <div name="parameter" className="parameter">     
                    <label className='param-label'>Имя параметра:<input type="text" name="parameter-name" className="parameter-name" /></label>
                    <label className='param-label'><p></p></label>
                    <select value={this.state.defaultParamState} className='select' id='select' onChange={this.handleChange} >
                    <option>Строка</option>
                    <option>Целочисленное значение</option>
                    <option>Перечисление</option>
                    <option>Не выбрано</option>
                    </select>
                    {this.state.parametersValues}
                    <button onClick={this.handleDelete} className='delete-type-button'> {'\u2718'} </button>
                    </div>
                )
            }
        }