$(document).on('change','#customerId',function(){
	
});

$(document).on('change','#secret',function(){
	document.cookie = "secret=" + $(this).val()
});


$(document).on('click-row.bs.table','#messagesTable' , function (event, row, $element) {
  alert(row.message);

})

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
  return [
      '<a class="like" href="javascript:void(0)" title="Edit">',
      '<button type="button" class="btn btn-info">Info</button>',
      '</a> ',
      '<a class="danger remove" href="javascript:void(0)" data-visitorserial="'+row.visitor_id+'" data-visitornames="'+row.visitor_names+'" data-visitorid="'+row.visitor_number+'" data-toggle="modal" data-target="#VisitorDelete" title="Remove">',
      '<i class="glyphicon glyphicon-trash"></i>',
      '</a>'
  ].join('');
}