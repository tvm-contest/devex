const paramOptions = {
    Integer: "Integer",
    Str: "String"
}

const defaultValues = {
    Integer: {
        minValue: 0,
        maxValue: 100,
        isRequired: true,
        name: "name"
    },
    Str: {
        minLength: 1,
        maxLength: 256,
        isRequired: true,
        name: "name"
    },
    Enum: {
        name: "name",
        variant: "variant"
    },
    Token: {
        name: "name",
        amount: 10
    }
}

const tokens = []
const params = []
let collectionImageData = ""

const createLabel = (text) => {
    const label = document.createElement("label")
    label.classList.add("text-dark")
    label.innerHTML = text + ":"

    return label
}

const createTokenTypeInput = (tokenObject) => {
    const tokenTypeInput = document.createElement("input")
    tokenTypeInput.classList.add("token-input", "form-control", "shadow-none")

    tokenTypeInput.name = "tokenType"
    tokenTypeInput.value = "Name"
    tokenTypeInput.placeholder = "Input the type of a token"
    tokenTypeInput.type = "text"
    tokenTypeInput.pattern = "[A-Za-z0-9]+"
    tokenTypeInput.title = "Only english letters are allowed"
    tokenObject.rarityName = defaultValues.Token.name
    tokenTypeInput.onchange = (e) => {
        tokenObject.rarityName = e.target.value
    }

    const tokenTypeLabel = createLabel("Token Type")

    const tokenDiv = document.createElement("div")
    tokenDiv.classList.add("token-input-container")
    tokenDiv.appendChild(tokenTypeLabel)
    tokenDiv.appendChild(tokenTypeInput)

    return tokenDiv
}

const createMaxTokensInput = (tokenObject) => {
    const maxTokensInput = document.createElement("input")
    maxTokensInput.classList.add("token-input", "form-control", "shadow-none")

    maxTokensInput.value = defaultValues.Token.amount
    maxTokensInput.name = "maxTokens"
    maxTokensInput.placeholder = "Input the amount"
    maxTokensInput.type = "number"
    tokenObject.amount = defaultValues.Token.amount
    maxTokensInput.onchange = (e) => {
        tokenObject.amount = e.target.valueAsNumber
    }

    const maxTokensLabel = createLabel("Max tokens")

    const maxTokenDiv = document.createElement("div")
    maxTokenDiv.classList.add("token-input-container")
    maxTokenDiv.appendChild(maxTokensLabel)
    maxTokenDiv.appendChild(maxTokensInput)

    return maxTokenDiv
}

const addToken = () => {
    tokens.push({})

    const tokenParamsDiv = document.createElement("div")
    tokenParamsDiv.classList.add("token-add-container")

    tokenParamsDiv.appendChild(createTokenTypeInput(tokens[tokens.length - 1]))
    tokenParamsDiv.appendChild(createMaxTokensInput(tokens[tokens.length - 1]))

    $(".tokens-container").append(tokenParamsDiv)
}

const createOption = (value, innerHTML) => {
    const option = document.createElement("option")
    option.innerHTML = innerHTML

    if (value) {
        option.value = value
    }

    return option
}

const createParamSelect = (id) => {
    const paramDiv = document.createElement("div")
    paramDiv.classList.add("param-input")
    paramDiv.id = `param-select-${id}`

    const paramSelect = document.createElement("select")
    paramSelect.classList.add("form-select")
    paramSelect.onchange = (e) => {
        $(`#param-select-${id}`).children(".param-element").remove()

        let paramElement = createEmptyForm(id)
        
        if (e.target.value == paramOptions.Integer) {
            paramElement = createIntForm(id)
        } else if (e.target.value == paramOptions.Str) {
            paramElement = createStringForm(id)
        } else if (e.target.value == paramOptions.Enum) {
            paramElement = createEnumForm(id)
        }

        paramElement.classList.add("param-element")
        $(`#param-select-${id}`).append(paramElement)
    }
    paramSelect.appendChild(createOption(null, "Choose parameter type"))

    Object.values(paramOptions).forEach((paramName) => {
        paramSelect.appendChild(createOption(paramName, paramName))
    })

    paramDiv.appendChild(paramSelect)
    return paramDiv
}

const createValueDiv = (type, labelText, onChange, defaultValue) => {
    const valueDiv = document.createElement("div")

    const valueLabel = createLabel(labelText)
    const valueInput = document.createElement("input")

    if (type === "text") {
        console.log("here") 
        valueInput.pattern = "^[a-zA-Z_$][a-zA-Z_$0-9]*"
        valueInput.title = "This field can't contain numbers as the first character"
    }

    if (type !== "checkbox") {
        valueInput.value = defaultValue
        valueInput.classList.add("form-control", "shadow-none")
    } else {
        valueInput.checked = defaultValue
        valueInput.classList.add("required-checkbox")
        valueDiv.classList.add("last-in-param")
    }

    valueInput.type = type
    valueInput.onchange = onChange
    valueDiv.classList.add("param-input")
    valueDiv.append(valueLabel, valueInput)

    return valueDiv
}

const createIntForm = (id) => {
    const formDiv = document.createElement("div")

    params[id] = {
        name: defaultValues.Integer.name,
        type: "int",
        minValue: defaultValues.Integer.minValue,
        maxValue: defaultValues.Integer.maxValue,
        isRequired: defaultValues.Integer.isRequired
    }

    const onNameChange = (e) => {
        params[id].name = e.target.value
    }

    const onMinValueChange = (e) => {
        params[id].minValue = e.target.valueAsNumber
    }

    const onMaxValueChange = (e) => {
        params[id].maxValue = e.target.valueAsNumber
    }

    const onRequiredChange = (e) => {
        params[id].isRequired = e.target.checked
    }

    const nameDiv = createValueDiv("text", "Parameter Name", 
                                    onNameChange, defaultValues.Integer.name)
    const minValueDiv = createValueDiv("number", "Min value", 
                                        onMinValueChange, defaultValues.Integer.minValue)
    const maxValueDiv = createValueDiv("number", "Max value", 
                                        onMaxValueChange, defaultValues.Integer.maxValue)
    const isRequiredDiv = createValueDiv("checkbox", "Is require", 
                                        onRequiredChange, defaultValues.Integer.isRequired)

    formDiv.append(nameDiv, minValueDiv, maxValueDiv, isRequiredDiv)
    return formDiv
}

const createStringForm = (id) => {
    const formDiv = document.createElement("div")

    params[id] = {
        name: defaultValues.Str.name,
        type: "string",
        minValue: defaultValues.Str.minLength,
        maxValue: defaultValues.Str.maxLength,
        isRequired: defaultValues.Str.isRequired
    }

    const onNameChange = (e) => {
        params[id].name = e.target.value
    }

    const onMinLengthChange = (e) => {
        params[id].minLength = e.target.valueAsNumber
    }

    const onMaxLengthChange = (e) => {
        params[id].minLength = e.target.valueAsNumber
    }

    const onRequiredChange = (e) => {
        params[id].isRequired = e.target.checked
    }

    const nameDiv = createValueDiv("text", "Parameter name", 
                                    onNameChange, defaultValues.Str.name)
    const minLengthDiv = createValueDiv("number", "Min length", 
                                        onMinLengthChange, defaultValues.Str.minLength)
    const maxLengthDiv = createValueDiv("number", "Max length", 
                                        onMaxLengthChange, defaultValues.Str.maxLength)
    const isRequiredDiv = createValueDiv("checkbox", "Is require", 
                                        onRequiredChange, defaultValues.Str.isRequired)

    formDiv.append(nameDiv, minLengthDiv, maxLengthDiv, isRequiredDiv)
    return formDiv 
}

const createVariantDiv = (paramId, variantId) => {
    const onVariantChange = (e) => {
        params[paramId].variantList[variantId] = e.target.value
    }

    const variantDiv = createValueDiv("text", "Enum variant", onVariantChange, defaultValues.Enum.variant)
    return variantDiv
}

const createEnumForm = (id) => {
    const formDiv = document.createElement("div")

    params[id] = {
        type: "enum",
        name: defaultValues.Enum.name,
        variantList: []
    }

    const onNameChange = (e) => {
        params[id].name = e.target.value
    }

    const nameDiv = createValueDiv("text", "Enum name", onNameChange, defaultValues.Enum.name)

    const variantList = document.createElement("div")
    variantList.id = "var-list"

    params[id].variantList.push(defaultValues.Enum.variant)
    const initialVariantDiv = createVariantDiv(id, params[id].variantList.length - 1)
    variantList.appendChild(initialVariantDiv)

    const addEnumVariantButton = document.createElement("button")
    addEnumVariantButton.innerText = "Add enum variant"
    addEnumVariantButton.classList.add("btn", "btn-outline-dark", "shadow-none", "param-input")

    addEnumVariantButton.onclick = (e) => {
        e.preventDefault()
        params[id].variantList.push(defaultValues.Enum.variant)

        const variantDiv = createVariantDiv(id, params[id].variantList.length - 1)
        $(`#param-select-${id}`).children(".param-element").children("#var-list").append(variantDiv)
    }

    const borderDiv = document.createElement("div")
    borderDiv.style = "margin-top: 15px;"
    borderDiv.classList.add("last-in-param")

    formDiv.append(nameDiv, variantList, addEnumVariantButton, borderDiv)
    return formDiv
}

const createEmptyForm = (id) => {
    const formDiv = document.createElement("div")
    params[id] = {}
    return formDiv
}

const addParam = () => {
    params.push({})
    const paramId = params.length - 1

    const paramSelect = createParamSelect(paramId)
    $(".param-container").append(paramSelect)
}

const checkNames = () => {
    const nameSet = new Set();
    for (let param of params) {
        if (nameSet.has(param.name)) {
            return false
        }

        nameSet.add(param.name)
    }

    return true
}

const onSubmit = async () => {
    if (!document.getElementById("collection-form").checkValidity()) {
        return
    }

    if (tokens.length < 1) {
        alert("Create at least one token")
        return
    }

    if (!checkNames()) {
        alert("Parameters can't have the same name")
        return
    }

    const collectionName = $("#collectionNameInput").val()
    const paramsToSend = []

    for (let param of params) {
        if (keywords.has(param.name)) {
            alert("Param has a forbidden word in its name")
            $("#collection-form").submit((e) => e.preventDefault())
            return
        }

        if (param.type === "enum") {
            const enumParam = {
                name: `_${param.name}` + "{" + param.variantList.toString() + "}",
                type: 'enum'
            }
            paramsToSend.push(enumParam)
        } else if (param && Object.keys(param).length) {
            paramsToSend.push(param)
        }
    }

    $("#collection-form").unbind("submit")
    $("#collection-form").allowDefault = true

    const collection = {
        rootName: collectionName,
        rootIcon: collectionImageData,
        raritiesList: tokens,
        paramsData: paramsToSend
    }
    
    await fetch("/createCollection", {
        method: "POST",
        body: JSON.stringify(collection),
        headers: {
            'Content-Type': 'application/json'
        }
    })

    $("#collection-form").trigger("submit")
}

const save = async () => {
    if (!document.getElementById("collection-form").checkValidity()) {
        return
    }

    if (tokens.length < 1) {
        alert("Create at least one token")
        return
    }

    if (!checkNames()) {
        alert("Parameters can't have the same name")
        return
    }

    const collectionName = $("#collectionNameInput").val()
    const paramsToSend = []

    for (let param of params) {
        if (keywords.has(param.name)) {
            alert("Param has a forbidden word in it's name")
            $("#collection-form").submit((e) => e.preventDefault())
            return
        }

        if (param.type === "enum") {
            const enumParam = {
                type: "enum",
                name: `_${param.name}` + "{" + param.variantList.toString() + "}"
            }
            paramsToSend.push(enumParam)
        } else if (param && Object.keys(param).length) {
            paramsToSend.push(param)
        }
    }

    const collection = {
        rootName: collectionName,
        rootIcon: collectionImageData,
        raritiesList: tokens,
        paramsData: paramsToSend
    }

    const response = await fetch("/saveCollectionParams", {
        method: "POST",
        body: JSON.stringify(collection),
        headers: {
            'Content-Type': 'application/json'
        }
    })

    const data = await response.json()
    download(`http://localhost:8081/${data.filename}`, "collectionParams")
}

const onUpload = () => {
    $("#image-input").trigger("click")
}

const importModel = () => {
    $("#model-input").trigger("click")
}

function download(fileUrl, fileName) {
    var a = document.createElement("a");
    a.href = fileUrl;
    a.setAttribute("download", fileName);
    a.click();
}

$("#image-input").on("change", async (e) => {
    if (e.target.files) {
        const fileObject = e.target.files[0]
        const reader = new FileReader()
        reader.onload = async () => {
            const base64 = reader.result
            const link = await fetch(
                "/loadIPFS",
                {
                    method: "POST",
                    body: JSON.stringify({ "base64": base64 }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )
            
            const data = await link.json()
            collectionImageData = data.link
        }

        reader.readAsDataURL(fileObject)
        document.getElementById("upload-text").style = "display: block;"
    }
})

$("#model-input").on("change", async (e) => { 
    if (e.target.files) {
        const dataFile = e.target.files[0]
        const reader = new FileReader()

        reader.onload = async () => {
            const collection = JSON.parse(reader.result)
            await fetch("/createCollection", {
                method: "POST",
                body: JSON.stringify(collection),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
        }

        reader.readAsText(dataFile)
    }
})
