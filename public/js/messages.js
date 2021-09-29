$(document).on('change','#customerId',function(){
	
});

function messageStyle(row, index) {
    if (row.isDelivered) { return { css: { 'background-color': '#d4edda' } } }
    else { return { css: { 'background-color': '#f8d7da' } } }
}
