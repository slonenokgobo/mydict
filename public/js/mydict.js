
function splitText() {

	$.ajax({
	  url: "/splittext",
	  data: { text: $("#input-text").val() }
	}).done(function( data ) {
		console.log(data)
	
		var wordsCount = Object.keys(data).length;
	
		$("#new-words").empty();
		
		if (wordsCount==0) {
			$("#new-words").append("<h4>No New Words</h4>");
			return false;
		}
		
		$("#new-words").append("<h4>New Words ("+wordsCount+")</h4>");
		
		var table = $("<table></table>");
		$("#new-words").append(table);
		$.each(data, function(word, dictEntry) {
			var word = "<td><span class='front'>"+word+"</span></td>";
			var dict = "<td><button type='button' class='btn btn-info' onclick='return addWord(this, \"card\")'>Create Card</button></td>";
			var card = "<td><button type='button' class='btn btn-success' onclick='return addWord(this, \"dict\")'>Known</button></td>";
			table.append("<tr>"+word+card+dict+"</tr>");
		})
	});
	
	return false;
}


function addWord(btn, to) {
	var par = $(btn).parents("tr");
	var text = par.find(".front").text();
	console.log("Adding " + text);

	$.ajax({
	  url: "/addword",
	  data: { card: {front:text, back:"", hint:""}, 'to' : to },
	  type: "POST",
	}).done(function( data ) {
		console.log("Added " + text);
	});
	par.remove();
	
	return false;
}
