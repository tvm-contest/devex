import ParameterForm from 'ParameterForm'
import CollectionForm from 'CollectionForm'

export default class MainForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }
  
    async handleSubmit(event) {
        event.preventDefault();
  
        let select_values = document.querySelectorAll(".select")
        let elems = Array.from(select_values, el => el.value);
  
        function checkUnique(arr) {
            return arr.length === new Set(arr).size;
        }
  
        var contractName = document.querySelectorAll(".contract-name")[0].value
        var maxSupply = document.querySelectorAll(".max-supply")[0].value
  
        var inputsList = document.getElementsByTagName("input");
        var inputs = Array.from(inputsList, el => el.value);
  
        var checkNegative = inputs.some( el => el < 0 );
  
        if (!elems.includes('Не выбрано') && !inputs.includes('') && !checkNegative && checkUnique(elems)) {
  
            let collectionTypes = document.querySelectorAll(".collectionType")
                
            var types = {}
            var type_values = {}
            for (let index = 0; index < collectionTypes.length; index++) {
                
               let collectionTypeName = document.querySelectorAll(".collectionType")[index].querySelectorAll(".collection-type-name")[0].value
  
               let collectionTypeMaxSupply = document.querySelectorAll(".collectionType")[index].querySelectorAll(".collection-type-max-supply")[0].value
  
               var type = {
                "collectionType": {
                    "name": collectionTypeName,
                    "collectionTypeMaxSupply": collectionTypeMaxSupply
                }
            }
  
            type_values["collection-type"] = type
  
            types[index] = type_values
  
            }
  
            var parameters = document.querySelectorAll(".parameter");
            var paramObj = {}

            for (let index = 0; index < parameters.length; index++) {
               
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
                
                var values = {}
  
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
  
            var collectionObject = {
            "collectionObject": {
                "collectionDetails": {
                    contractName: contractName,
                    maxSupply: maxSupply
                    },
                "collectionTypes": types,
                "collectionParameters": paramObj
                }
            }
  
            await fetch('/parameter-form', {
                method: 'POST',
                body: JSON.stringify(collectionObject),
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
  
        } else {
            event.preventDefault();
            alert('Значения формы введены некорректно. \n Возможные ошибки: \n 1. Значение параметра перезаписано или не выбрано. \n 2. Пустое поле. \n 3. Отрицательные значения для числовых параметров. \n Проверьте введенные данные и попробуйте снова')
        }
    }
  
  render(){
    return(
        <div className='main-form'>
          <CollectionForm />
          <ParameterForm />
          <button onClick={this.handleSubmit} className="button"> Сохранить </button>
        </div>
    )
  }
  }