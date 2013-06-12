
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
				console.log(dictEntry.original)
				phrase = phrase.replace(dictEntry.original, "<b>"+dictEntry.original+"</b>");

				var wordInfo = "<div><h5 class='word'>"+word+"</h5></div>";
				wordInfo += "<div><span class='use'><small>"+phrase+"<small></span></div>";
				wordInfo += "<div class='buttons' ><button type='button' class='btn btn-success' onclick='return knownWord(this)'>Known</button>";
				wordInfo += " <button type='button' class='create-card-button btn btn-info' onclick='return editCard(this)'>Create&nbsp;card</button></div>";
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

function knownWord(btn, cardType) {
	var par = $(btn).parents(".word-info");
	var text = par.find(".word").text();
	console.log("Adding a known word " + text);

	$.ajax({
	  url: "/addword",
	  data: { word: text },
	  type: "POST",
	}).done(function( data ) {
		console.log(data);
	});
	par.remove();
	return false;
}


function createCard(btn, cardType) {
	var par = $(btn).parents(".word-info");
	var text = par.find(".card-front").find(".text").text();
	var back = par.find(".card-back").find(".text").text();
	var hint = par.find(".card-hint").find(".text").text();

	console.log("Creating a card");
	console.log({front:text, 'back':back, 'hint':hint});

	$.ajax({
	  url: "/createcard",
	  data: { word: text, card: {front:text, 'back':back, 'hint':hint} },
	  type: "POST",
	}).done(function( data ) {
		console.log(data);
	});
	par.remove();
	
	return false;
}

function callback(test) {
	console.log(test)
}

function editCard(btn) {
	var par = $(btn).parents(".word-info");
	var word = par.find(".word").text();
	var use = par.find(".use").text();
	
	var cardWrapper = $("<div></div>");
	var card = $("<div class='card' style='background-color: #f7f7f9;'></div>");
	var cardFront = $("<div class='card-front'></div>");
	var cardBack = $("<div class='card-back'></div>");
	var cardHint = $("<div class='card-hint initial'></div>");
	var cancelButton = $("<button type='button' class='btn btn-danger'>Cancel</button>");	
	var yandexButton = $("<button type='button' class='btn'>Yandex</button>");	
	var buttons = $("<div class='buttons'></div>");
	
	cardFront.append("<span>Front: </span><span class='text' onClick=\"this.contentEditable='true';\">" + word+"</span>");
	cardBack.append("<span>Back: </span><span class='text' onClick=\"this.contentEditable='true';\"></span>");
	cardHint.append("<span>Hint: </span><span class='text' onClick=\"this.contentEditable='true';\">" + use+"</span>");
	
	buttons.append(cancelButton);
	buttons.append(" ");
	buttons.append("<button type='button' class='btn btn-success' onclick='return createCard(this)'>Create</button>");
	buttons.append(" ");
	buttons.append(yandexButton);
	
	card.append(cardFront).append(cardBack).append(cardHint);
	cardWrapper.append(card).append(buttons);
	
	var saveHtml = par.html();
	par.html(cardWrapper);
	
	yandexButton.click(function() {
	
		$.ajax({
           url: "http://m.slovari.yandex.ru/translate.xml?lang=fr&text="+word,
           type: 'GET',
           success: function(res) {
             //var content = $(res.responseText).html();
             var resHtml = $(res.responseText);
             
             par.find(".yandex-translation").remove();
             var yandexTranslation = $("<div class='yandex-translation' style='padding-top:10px'></div>");
             yandexTranslation.append(resHtml.find(".b-title").html());
             yandexTranslation.append(resHtml.find(".b-translate"));
             
             yandexTranslation.find("p").click(function() {
             	if (cardHint.hasClass("initial")) {
             		cardHint.removeClass("initial");
             		cardHint.find(".text").text($(this).text());
             	} else {
             		var oldText = cardHint.find(".text").text();
             		cardHint.find(".text").text(oldText + ", " + $(this).text());
             	}
             })
             cardWrapper.append(yandexTranslation);
           }
         });        	
	})
	
	cancelButton.click(function() {
		par.html(saveHtml);
		return false;
	})
	
	tranapi.translate(word, "fr-ru", function (trans) {
		console.log(trans);
		cardBack.find(".text").text(trans.translate.text[0]);
	})	
}

function startLearning(btn) {
	var row = $('<div class="row-fluid learning-window"></div>');
	var span = $('<div class="span12 full-screen-learning"></div>');
	var table = $("<table style='width:100%;height:100%'></table>");
	
	var card = $("<tr><td style='height:100%;text-align:center;vertical-align:middle'>card</td></tr>");
	var bar = '<tr><td><button class="btn btn-danger offset1">Forgot</button> <button class="btn btn-warning offset3">Hard</button> <button class="btn btn-success offset3">Easy</button></td></tr>';
	span.height($(window).height());
	row.append( span.append(table.append(card).append(bar)) );
	
	$(btn).parent().parent().parent().after(row);
	$('html,body').animate({ scrollTop: row.offset().top });
}