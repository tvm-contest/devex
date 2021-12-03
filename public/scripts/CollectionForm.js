export default class CollectionForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            collectionTypes: []
        };
        this.handleAddType = this.handleAddType.bind(this);
        this.handleDeleteType = this.handleDeleteType.bind(this);
    }

        handleAddType(event){ 
            event.preventDefault();
            this.setState({
                collectionTypes: [...this.state.collectionTypes, <CollectionType /> ]
            })
        }

        handleDeleteType(event){
                event.preventDefault();
                event.target.parentElement.remove()
        }

        render(){
            return(
                <div>
                <div className="parameterForm">
                <p className="form-title">Создание контракта</p>
                <label className='param-label'>Название контракта:<input type="text" name="contract-name" className="contract-name" /></label>
                <label className='param-label'>Максимальное количество токенов:<input type="number" name="max-supply" className="max-supply" /></label>
                <label className='param-label'><p></p></label>
                <p className="form-title">Типы токенов</p>
                {this.state.collectionTypes}
                <button onClick={this.handleAddType} className="button"> Добавить тип </button>
                </div>
                </div>
            )
        }

}

class CollectionType extends CollectionForm {
            render() {
                return ( 
                    <div>
                    <div name="collectionType" className="collectionType">
                    <p>Тип токена</p>
                    <button onClick={this.handleDeleteType} className='delete-type-button'> {'\u2718'} </button>
                    <label className='param-label'>Тип коллекции:<input type="text" name="collection-type-name" className="collection-type-name" /></label>
                    <label className='param-label'>Количество токенов:<input type="number" name="collection-type-max-supply" className="collection-type-max-supply" /></label>
                    </div>
                    </div>
                )
            }
        }
