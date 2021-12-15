
const fromCollectionListToTokenList = (container) => {
  //collectionAddress = $(container).find(".collection-address")[0].value
  console.log($(container).attr("id"))
  console.log($(container).parent().parent().parent())
  loader(container)
  window.location.href = '/tokens-data-info?rootNftAddress=' + $(container).attr("id")
}

const fromTokenListToToken = (container) => {
  tokenAddress = container.firstChild.data
  loader(container)
  window.location.href = "/one-token-info?tokenAddress=" + tokenAddress
}
