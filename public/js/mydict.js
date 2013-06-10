
function splitText() {

	$.ajax({
	  url: "/splittext",
	  data: { text: $("#input-text").val() },
	  type: "POST",
	}).done(function( data ) {
		console.log(data)
	
		$("#words").empty();
		$("#words").append("<h4>Words</h4>");
		
		var words = $("<div class='span12' style='margin-bottom:10px'></div>");
		$("#words").append(words);
		
		var total=0,known=0,learning=0,unknown=0;
		
		$.each(data, function(word, dictEntry) {
			total++;
			if (!dictEntry.cardtype) {
				var phrase = dictEntry.use;
				phrase = phrase.replace(word, "<b>"+word+"</b>");
				
				var wordInfo = "<div onClick=\"this.contentEditable='true';\"><h5 class='word'>"+word+"</h5></div>";
				wordInfo += "<div onClick=\"this.contentEditable='true';\" class='use'><small>"+phrase+"<small></div>";
				wordInfo += "<div onClick=\"this.contentEditable='true';\" class='translation'></div>";
				wordInfo += "<div class='buttons' ><button type='button' class='btn btn-success' onclick='return addWord(this, \"known\")'>Known</button>";
				wordInfo += " <button type='button' class='btn btn-info' onclick='return addWord(this, \"learning\")'>Study</button>";
				wordInfo += " <button type='button' class='btn' onclick='return translateWord(this)'>Translate</button></div>";
				words.append("<div class='word-info'>"+wordInfo+"</div>");
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
	var par = $(btn).parents(".word-info");
	var text = par.find(".word").text();
	var hint = par.find(".use").text();
	console.log("Adding " + text);

	$.ajax({
	  url: "/addword",
	  data: { word: text, card: {front:text, back:"", 'hint':hint}, 'cardtype' : cardType },
	  type: "POST",
	}).done(function( data ) {
		console.log(data);
	});
	par.remove();
	
	return false;
}

function translateWord(btn) {
	var par = $(btn).parents(".word-info");
	var text = par.find(".word").text();
	console.log("Translating " + text);

	$.ajax({
	  url: "/translate",
	  data: { word: text }
	}).done(function( data ) {
		par.find(".translation").html(data);
	});
	
	return false;
}
