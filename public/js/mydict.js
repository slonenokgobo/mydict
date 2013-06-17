
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
				phrase = phrase.replace(new RegExp("\\b" + dictEntry.original + "\\b", "g"), "<b>"+dictEntry.original+"</b>");

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
	var use = par.find(".use").text();
	console.log("Adding a known word " + text);

	$.ajax({
	  url: "/addword",
	  data: { word: text, card: {front:"", back:"", hint:use }},
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

var cardCounter = 0;
function getNextCard() {
	if (!cards || !cards[cardCounter]) return;
	
	while (cards[cardCounter]['removed']) {
		cardCounter++;
	}
	
	var entry = cards[cardCounter++];
	var card = entry.card;
	console.log(card);
	var cardHtml = $("<tr style='width:100%'><td id='"+entry._id+"' style='position:relative;height:100%;text-align:center;vertical-align:middle card'><span class='card-text' style='z-index:10'>"+card.back+"<span></td></tr>");
	
	var histDiv = $("<div class='history' style='position:absolute;top:0;left:0;z-index:-1'></div>");
	cardHtml.find("td").append(histDiv);
	
	if (entry.history && entry.history[0]) {
		var firstDate = entry.history[0].date;
		for (i in entry.history) {
			var hist = entry.history[i];
			var daysSince = parseInt((hist.date-firstDate)/(1000*60*60*24));
			console.log(daysSince);
			histDiv.append("<div class='circleBase "+hist.status.toLowerCase()+"'></div>");
			for (j=0;j<daysSince;j++) {
				histDiv.append("<div class='circleBase empty'></div>");
			}
		}
	}
		
	var states = ["back", "hint", "front"];
	var stateCounter=1;
	cardHtml.click(function() {
		var nextState = states[stateCounter%3];
		stateCounter++;
		cardHtml.find(".card-text").text(card[nextState]);
	});
	
	return cardHtml;
}

function startLearning(btn) {

	if ($(btn).hasClass("btn-danger")) {
		$(".learning-window").remove();
		cardCounter=0;
		$(btn).removeClass("btn-danger").addClass("btn-success").text("Start Learning");
		return false;
	}
	
	$(btn).removeClass("btn-success").addClass("btn-danger").text("Stop Learning");

	var row = $('<div class="row-fluid learning-window"></div>');
	var span = $('<div class="span12 full-screen-learning"></div>');
	var table = $("<table style='width:100%;height:100%'></table>");
	
	var card = getNextCard();
	var bar = '<tr><td style="text-align:center"><button class="btn btn-danger btn-large next-card">Forgot</button><span style="padding:10px"></span><button class="btn btn-warning btn-large next-card">Hard</button><span style="padding:10px"></span><button class="btn btn-success btn-large next-card">Easy</button></td></tr>';
	span.height($(window).height());
	row.append( span.append(table.append(card).append(bar)) );

	$(btn).parents(".row-fluid").after(row);
	$('html,body').animate({ scrollTop: row.offset().top });
	
	$(".next-card").click(function() {
		var cardStatus = $(this).text();
		var cardId = card.find("td").attr('id');
		$.ajax({
		  url: "/cardhistory",
		  data: { id:cardId, status: cardStatus },
		  type: "POST",
		}).done(function( data ) {
			console.log(data);
		});
		
		card = getNextCard();
		table.find("tr:first").remove();
		table.prepend(card);
	});
}

function moveCardToDict(btn, cardId, offset) {
	var row = $(btn).parents("tr");
	console.log(cardId)
	$.ajax({
	  url: "/card",
	  data: { id:cardId, cardType:"known" },
	  type: "POST",
	}).done(function( data ) {
		console.log(data);
	});
	row.remove();
	if (cards && cards[offset]) {
		cards[offset]['removed'] = true;
	}
	return false;
}
