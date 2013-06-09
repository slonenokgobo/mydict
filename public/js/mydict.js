
function splitText() {

	$.ajax({
	  url: "/splittext",
	  data: { text: $("#input-text").val() }
	}).done(function( data ) {
		console.log(data)
	
		$("#words").empty();
		$("#words").append("<h4>Words</h4>");
		
		var table = $("<table></table>");
		$("#words").append(table);
		
		var total=0,known=0,learning=0,unknown=0;
		
		$.each(data, function(word, dictEntry) {
			total++;
			if (!dictEntry.cardtype) {
				var word = "<td><span class='front'>"+word+"</span></td>";
				var dict = "<td><button type='button' class='btn btn-info' onclick='return addWord(this, \"learning\")'>Create Card</button></td>";
				var card = "<td><button type='button' class='btn btn-success' onclick='return addWord(this, \"known\")'>Known</button></td>";
				table.append("<tr>"+word+card+dict+"</tr>");
				unknown++;
			} else if (dictEntry.cardtype=="known") {
				known++;
			} else {
				learning++;
			}
		})

		var percentage = total==0?"":" ("+Math.round(100*unknown/total)+"%)";
		$("#words").children().first().after("<p>Total "+total+", unknown "+unknown+percentage+", known "+known+", learning "+learning+"</p>");
	});
	
	return false;
}


function addWord(btn, cardType) {
	var par = $(btn).parents("tr");
	var text = par.find(".front").text();
	console.log("Adding " + text);

	$.ajax({
	  url: "/addword",
	  data: { word: text, card: {front:text, back:"", hint:""}, 'cardtype' : cardType },
	  type: "POST",
	}).done(function( data ) {
		console.log(data);
	});
	par.remove();
	
	return false;
}
