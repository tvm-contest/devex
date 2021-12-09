const onUpload = () => {
    $("#file-input").trigger("click")
}

$("#file-input").on("change", async (e) => {
    const fileObject = e.target.files[0]
    const reader = new FileReader()
    reader.onload = async () => {
        const base64 = reader.result.replace("data:", "").replace(/^.+,/, "")
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
        
        const linkTag = document.createElement("a")
        linkTag.classList.add("text-muted")
        linkTag.href = data.link
        linkTag.innerText = "Link to your file"

        $("#url-div").empty()
        $("#url-div").append(linkTag)
    }

    reader.readAsDataURL(fileObject)
})