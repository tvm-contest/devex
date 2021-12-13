(async () => {
    const rootDiv = document.getElementById("root")
    const collectionsResponse = await fetch("/collectionsList/getCollections")
    const collections = await collectionsResponse.json()

    for (let collection of collections) {
        const collectionDiv = document.createElement("div")
        collectionDiv.classList.add("collection-container")

        const collectionName = document.createElement("p")
        collectionName.classList.add("text-dark")
        collectionName.innerText = `Collection name: ${collection.rootName}`

        const collectionIcon = document.createElement("p")
        collectionIcon.classList.add("test-dark")
        collectionIcon.innerText = "Collection icon: "

        const imageDataResponse = await fetch(collection.rootIcon)
        const imageData = await imageDataResponse.text()
        const image = document.createElement("img")
        image.src = imageData

        const tokensList = document.createElement("p")
        tokensList.classList.add("test-dark")
        tokensList.innerText = "Tokens list: "

        collectionDiv.append(collectionName, collectionIcon, image, tokensList)

        for (let token of collection.raritiesList) {
            const tokenDiv = document.createElement("div")
            tokenDiv.classList.add("token-container")

            const tokenName = document.createElement("p")
            tokenName.innerText = `Token name: ${token.rarityName}`
    
            const tokenAmount = document.createElement("p")
            tokenAmount.innerText = `Token name: ${token.amount}`

            tokenDiv.append(tokenName, tokenAmount)
            collectionDiv.append(tokenDiv)
        }

        rootDiv.appendChild(collectionDiv)
    }
})()