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

function TableActions (value, row, index) {
  return '<button type="button" class="btn btn-danger">Delete</button>';
}

function makeShortUrl (value, row, index) {
  const callbackUrl = row.callbackUrl;
  return (callbackUrl.length>120 ? `${callbackUrl.slice(0,100)}...`: callbackUrl)
}

function detailFormatter(index, row) {
  var html = []
  $.each(row, function (key, value) {
    html.push('<p><b>' + key + ':</b> ' + value + '</p>')
  })
  return html.join('')
}