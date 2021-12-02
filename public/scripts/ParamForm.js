//
// TODO: get rid of queryselector, add all params to {state}
//

import '/stylesheets/styles'

export default class ParamForm extends React.Component {

        constructor(props) {
            super(props);
            this.state = {
                defaultParamState: 'Не выбрано',
                parametersValues: '',
                params: []
            };
            this.handleChange = this.handleChange.bind(this);
            this.handleSubmit = this.handleSubmit.bind(this);
            this.handleAdd = this.handleAdd.bind(this);
            this.addParameter = this.addParameter.bind(this);
        }

        addParameter(state) {
            switch (state) {
                case 'Целочисленное значение':
                    return ( 
                        <div>
                        <label className='param-label'>Минимальное значение:<input type="text" name="min value" className="param_value" /></label>
                        <label className='param-label'>Максимальное значение:<input type="text" name="max value" className="param_value" /></label>
                        <label className='param-label'><input name="isMandatory" type="checkbox" className="isMandatory"/> Обязательный параметр</label>
                        <label className='param-label'><input name="isOnChain" type="checkbox" className="isOnChain"/> Хранить он-чейн</label>
                        </div>
                    );
                    break;
                case 'Строка':
                    return ( 
                        <div>
                        <label className='param-label'>Минимальная длина:<input type="text" name="min length" className="param_value" /></label>
                        <label className='param-label'>Максимальная длина:<input type="text" name="max length" className="param_value" /></label>
                        <label className='param-label'><input name="isMandatory" type="checkbox" className="isMandatory"/> Обязательный параметр</label>
                        <label className='param-label'><input name="isOnChain" type="checkbox" className="isOnChain"/> Хранить он-чейн</label>
                        </div>
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
                    params: [...this.state.params, < Param / > ]
                })
            }

            handleDelete(event) {
                event.preventDefault();
                event.target.parentElement.remove()
            }


            async handleSubmit(event) {
                event.preventDefault();

                let select_values = document.querySelectorAll(".select")
                let elems = Array.from(select_values, el => el.value);

                function checkUnique(arr) {
                    return arr.length === new Set(arr).size;
                }

                if (!elems.includes('Не выбрано') && checkUnique(elems)) {
                    var parameters = document.querySelectorAll(".parameter");
                    var paramObj = {}
                    for (let index = 0; index < parameters.length; index++) {
                        var values = {}
                        let paramType = document.querySelectorAll(".parameter")[index].querySelectorAll(".select")[0].value

                        switch (paramType) {
                            case 'Строка':
                                paramType = 'string';
                                break;
                            case 'Целочисленное значение':
                                paramType = 'integer';
                                break;
                        }

                        let paramValues = document.querySelectorAll(".parameter")[index].querySelectorAll(".param_value")

                        for (let index = 0; index < paramValues.length; index++) {
                            values[paramValues[index].name] = paramValues[index].value
                        }

                        let isMandatory = document.querySelectorAll(".parameter")[index].querySelectorAll(".isMandatory")[0].checked
                        
                        let isOnChain = document.querySelectorAll(".parameter")[index].querySelectorAll(".isOnChain")[0].checked
                        
                        let parameterName = document.querySelectorAll(".parameter")[index].querySelectorAll(".parameter-name")[0].value

                        var param = {
                        "parameter": {
                            "name": parameterName,
                            "type": paramType,
                            "value": values,
                            "isMandatory": isMandatory,
                            "isOnChain": isOnChain
                            }
                        }
                        
                          paramObj[index] = param
       
                    }


                    await fetch('/parameter-form', {
                        method: 'POST',
                        body: JSON.stringify(paramObj),
                        mode: 'cors',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                } else {
                    event.preventDefault();
                    alert('Значение параметра перезаписано или не выбрано. Проверьте введенные данные и попробуйте снова')
                }
            }

            render() {
                return ( 
                    <div>
                    <form className="parameterForm">
                    <p className="form-title">Параметры конструктора</p>
                    <center>
                    <p>Добавление параметров смарт-контракта — неотъемлемая часть <a href="url">кастомизации NFT</a>. Нажмите "Добавить параметр" и укажите выбранное значение. Больше информации об этом этапе создании контракта можно найти <a href="url">здесь</a>.</p>
                    </center>
                    {this.state.params}
                    <button onClick={this.handleAdd} className="button"> Добавить параметр </button>
                    <button onClick={this.handleSubmit} className="button"> Сохранить </button>
                    </form>
                    </div>
                );
            }
        }

        class Param extends ParamForm {
            render() {
                return ( 
                    <div name="parameter" className="parameter">     
                    <label className='param-label'>Имя параметра:<input type="text" name="parameter-name" className="parameter-name" /></label>
                    <label className='param-label'><p></p></label>
                    <select value={this.state.defaultParamState} className='select' id='select' onChange={this.handleChange} >
                    <option>Строка</option>
                    <option>Целочисленное значение</option>
                    <option>Не выбрано</option>
                    </select>
                    {this.state.parametersValues}
                    <button onClick={this.handleDelete} className='delete-type-button'> {'\u2718'} </button>
                    </div>
                )
            }
        }
