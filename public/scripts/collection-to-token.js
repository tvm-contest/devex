
const fromCollectionListToTokenList = (container) => {
  collectionAddress = $(container).find(".collection-address")[0].innerHTML 
  window.location.href = '/tokens-data-info?rootNftAddress=' + collectionAddress
}

const fromTokenListToToken = (container) => {
  tokenAddress = container.innerHTML 
  window.location.href = "/one-token-info?tokenAddress=" + tokenAddress
}
