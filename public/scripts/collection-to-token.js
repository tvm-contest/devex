
const fromCollectionListToTokenList = (container) => {
  collectionAddress = $(container).find(".collection-address")[0].innerHTML 
  window.location.replace('/tokens-data-info?rootNftAddress=' + collectionAddress);
}

const fromTokenListToToken = (container) => {
  tokenAddress = container.innerHTML 
  window.location.replace("/one-token-info?tokenAddress=" + tokenAddress);
}
