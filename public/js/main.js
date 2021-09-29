$(document).on('change','#customerId',function(){
	
});

function rowStyle(row, index) {
    if (row.isDelivered) {
        return { css: { color: 'green' } }
    }
    else{
        return { css: { color: 'red' } }
    }
  }