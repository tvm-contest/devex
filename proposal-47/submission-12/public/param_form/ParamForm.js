import SelectParamInput from 'selectParamInput';

const ParamForm = () => {
  const [paramArr, setParamArr] = React.useState([{}]);

  const onSubmit = async (e) => {
    const toSend = [];
    for (let param of paramArr) {
      if (param.properties && Object.keys(param.properties).length) {
        toSend.push(param.properties);
      }
    }

    await fetch('/my-sample/param-form', {
      method: 'POST',
      body: JSON.stringify(toSend),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  };

  return (
    <div className='param-form-div'>
      <form>
        <div>
          <button className='form-button' type='button' onClick={() => setParamArr([...paramArr, {}])}>
            Add parameter
          </button>
        </div>
        {paramArr.map((x, idx) => (
            <SelectParamInput paramObject={x} key={idx}/>
        ))}

        { paramArr.length > 0 && 
          <button className='form-button' type='submit' onClick={onSubmit}>Load parameters</button>
        }
      </form>
    </div>
  );
};

export default ParamForm;
