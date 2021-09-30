$(document).on('change','#customerId',function(){
	
});

$(document).on('change','#secret',function(){
	document.cookie = "secret=" + $(this).val()
});

$( document ).ready(function() {
    $('#secret').val(getCookie('secret'));
});

function getCookie(name) {
    let matches = document.cookie.match(new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
  }

function messageStyle(row, index) {
    if (row.isDelivered) { return { css: { 'background-color': '#d4edda' } } }
    else { return { css: { 'background-color': '#f8d7da' } } }
}
