const showPrivatekey = () => { 
    const privateKeyInput = document.getElementById("privatekey-input")
    const type = privateKeyInput.type === "password" ? "text" : "password"

    privateKeyInput.type = type
}

const submitSettings = async () => {
    const pubkey = document.getElementById("pubkey-input").value
    const privatekey = document.getElementById("privatekey-input").value
    const walletAddress = document.getElementById("wallet-address-input").value
    const network = document.getElementById("network-select").value

    await fetch("/settings", {
        method: "POST",
        body: JSON.stringify({ pubkey, privatekey, walletAddress, network }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
}