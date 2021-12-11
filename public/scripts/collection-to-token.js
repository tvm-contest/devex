
const fromCollectionListToTokenList = (container) => {
  //collectionAddress = $(container).find(".collection-address")[0].value
  console.log($(container).attr("id"))
  console.log($(container).parent().parent().parent())
  window.location.href = '/tokens-data-info?rootNftAddress=' + $(container).attr("id")
}

const fromTokenListToToken = (container) => {
  tokenAddress = container.innerHTML 
  window.location.href = "/one-token-info?tokenAddress=" + tokenAddress
}
