function onUpload() {
    var arr_for_name_img = name_img.split(',');
    for(var i = 0;i<arr_for_name_img.length;i++){
        $(".for-img").append($(`<div class="col-lg-4 img" id="${i}""></div>`))
        $(`#${i}`).append($(`<img src="image/${arr_for_name_img[i]}" height="200"  onclick="onUploadIpfs(this)"">`))
    }
    $("#folder").prop('disabled', true); //Отключает кнопку после нажатия

}

async function onUploadIpfs(e) {
    console.log(e.src.split("/").pop())
    console.log($(e).parent().attr("id"))
    var name_file =e.src.split("/").pop()
    
    const link = await fetch(
            "/loadIPFS/fromFolder",
            {
                method: "POST",
                body: JSON.stringify({"name":name_file}),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        )
    const data = await link.json();
    console.log('Успех:', JSON.stringify(data));
    const linkTag = document.createElement("a")
    linkTag.classList.add("text-muted")
    linkTag.classList.add("row")
    linkTag.href = data.link
    linkTag.innerText = "Link to your file"
    
    $(`#${$(e).parent().attr("id")}`).append(linkTag)
    $(e).prop("onclick", null).off("click");
}

function onUpload_() {
    $("#file-input").trigger("click")
}
$("#file-input").on("change", async (e) => {
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
        
        const linkTag = document.createElement("a")
        linkTag.classList.add("text-muted")
        linkTag.href = data.link
        linkTag.innerText = "Link to your file"

        $("#url-div").empty()
        $("#url-div").append(linkTag)
    }

    reader.readAsDataURL(fileObject)
})