$(document).on('change','#customerId',function(){
	
});

function messageStyle(row, index) {
    if (row.isDelivered) { return { css: { 'background-color': '#bcffa6' } } }
    else { return { css: { 'background-color': '#fcbdbd' } } }
}
