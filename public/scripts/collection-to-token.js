
const fromCollectionListToTokenList = (container) => {
  collectionAddress = $(container).find(".collection-address")[0].innerHTML 
  $.redirectPost('/tokens-data-info', {rootNftAddress: collectionAddress})
}

const fromTokenListToToken = (container) => {
  tokenAddress = container.innerHTML 
  window.location.replace("/one-token-info?tokenAddress=" + tokenAddress);
}

// jquery extend function
$.extend(
  {
    redirectPost: function(location, args)
    {
      var form = '';
      $.each( args, function( key, value ) {
        form += '<input type="hidden" name="'+key+'" value="'+value+'">';
      });
      $('<form action="'+location+'" method="POST">'+form+'</form>').appendTo('body').submit();
    }
  });