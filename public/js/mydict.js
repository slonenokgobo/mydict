function splitText() {

	$.ajax({
	  url: "/splittext",
	  data: { text: $("#input-text").val() },
	  type: "POST",
	}).done(function( data ) {
		console.log(data)
	
		$("#words").empty();
		$("#words").append("<h4>Words</h4>");
		
		var words = $('<table class="table table-striped"></table>');
		words.append('<thead><tr><th>#</th><th>Word</th><th>Film Score</th><th>Book Score</th><th></th></tr></thead>')
		var wordsContainer = $('<tbody></tbody>');
		words.append(wordsContainer)
		$("#words").append(words);
		
		var total=0,known=0,learning=0,unknown=0;
		
		$.each(data, function(word, dictEntry) {
			total++;
			if (!dictEntry.cardtype) {
				var phrase = dictEntry.use;
				console.log(dictEntry.original)
				phrase = phrase.replace(new RegExp("(\\W|^)(" + dictEntry.original + ")(\\W|$)", "gi"), "$1<b>$2</b>$3");

				var wordInfo = "<td>"+total+"</td>"
				wordInfo += "<td><h5 class='word' style='margin:0'>"+word+"</h5></td>";
				wordInfo += "<td>"+dictEntry['7_freqlemfilms2']+"</td><td>"+dictEntry['8_freqlemlivres']+"</td>";
				//wordInfo += "<div><span class='use'><small>"+phrase+"<small></span></div>";
				wordInfo += "<td class='buttons' style='white-space: nowrap;'>"
				wordInfo += "<button type='button' class='btn btn-success btn-xs' onclick='return knownWord(this)'>Known</button>";
				wordInfo += " <button type='button' class='create-card-button btn btn-info btn-xs' onclick='return editCard(this)'>Create&nbsp;card</button></div>";
				wordsContainer.append("<tr class='word-info'>"+wordInfo+"</tr>");
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

function translateWord() {
	var word = $("#input-word").val();
	
	var words = $('<table class="table table-striped"></table>');
	words.append('<thead><tr><th>#</th><th>Word</th><th>Film Score</th><th>Book Score</th><th></th></tr></thead>')
	var wordsContainer = $('<tbody></tbody>');
	words.append(wordsContainer)

	var wordInfo = "<td>1</td>"
	wordInfo += "<td><h5 class='word' style='margin:0'>"+word+"</h5></td>";
	wordInfo += "<td>unknown</td><td>unknown</td>";
	wordInfo += "<td class='buttons' style='white-space: nowrap;'>"
	wordInfo += "<button type='button' class='btn btn-success btn-xs' onclick='return knownWord(this)'>Known</button>";
	wordInfo += " <button type='button' class='create-card-button btn btn-info btn-xs' onclick='return editCard(this)'>Create&nbsp;card</button></div>";
	wordsContainer.append("<tr class='word-info'>"+wordInfo+"</tr>");
	
	$("#words").empty();
	$("#words").append("<h4>Card</h4>");
	$("#words").append(words);
	
	$("#words").find(".create-card-button").attr("inverse", true).click();
	
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
		getProgress();
	});
	par.remove();
	$('.creating-card').remove();
	return false;
}


function createOrUpdateCard(btn, hideAfter) {
	var par = $(btn).parents(".card-container");
	var text = par.find(".card-front").find(".text").text();
	var back = par.find(".card-back").find(".text").text();
	var hint = par.find(".card-hint").find(".text").text();

	console.log("Creating a card");
	console.log({front:text, 'back':back, 'hint':hint});

	$.ajax({
	  url: "/card",
	  data: { word: text, card: {front:text, 'back':back, 'hint':hint} },
	  type: "POST",
	}).done(function( data ) {
		console.log(data);
		getProgress();
	});
	
	if (hideAfter){
		var cardRow = $(btn).parents(".creating-card");
		cardRow.prev().remove();
		cardRow.remove();
	}
	
	return false;
}

function callback(test) {
	console.log(test)
}

function editCard(btn) {
	var inverse = $(btn).attr("inverse");
	
	var par = $(btn).parents(".word-info");
	var word = par.find(".word").text();
	var use = par.find(".use").text();
  
	var cardWrapper = $("<td colspan='3' class='card-container'></td>");
	var card = $("<div class='card panel panel-info' style='background-color: #f7f7f9;margin-top:10px;margin-bottom:5px'></div>");
	var cardHeader = $('<div class="panel-heading"><h3 class="panel-title">Card</h3></div>');
	var cardBody = $('<div class="panel-body"></div>');
	var cardFront = $("<div class='card-front'></div>");
	var cardBack = $("<div class='card-back'></div>");
	var cardHint = $("<div class='card-hint initial'></div>");
	var cancelButton = $("<button type='button' class='btn btn-danger btn-xs'>Cancel</button>");	
	var yandexButton = $("<button type='button' class='btn btn-xs'>Yandex</button>");	
	var buttons = $("<div class='buttons' style='text-align:center'></div>");
	
	cardFront.append("<span>Front: </span><span class='text' onClick=\"this.contentEditable='true';\">" + (inverse?"":word)+"</span>");
	cardBack.append("<span>Back: </span><span class='text' onClick=\"this.contentEditable='true';\">"+(inverse?word:"")+"</span>");
	cardHint.append("<span>Hint: </span><span class='text' onClick=\"this.contentEditable='true';\">" + use+"</span>");
	
	buttons.append(cancelButton);
	buttons.append(" ");
	buttons.append("<button type='button' class='btn btn-success btn-xs' onclick='return createOrUpdateCard(this, true)'>Create</button>");
	buttons.append(" ");
	buttons.append(yandexButton);
	
	cardBody.append(cardFront).append(cardBack).append(cardHint);
	card.append(cardHeader).append(cardBody);
	cardWrapper.append(card).append(buttons);
	
	var rowWithCard = $("<tr class='creating-card'></tr>").append("<td></td>").append(cardWrapper).append("<td></td>");
	par.after(rowWithCard);
	
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
		rowWithCard.remove();
		return false;
	})
	var translateTo = "fr-ru";
	if (inverse) {
		translateTo = "ru-fr";
	}
	tranapi.translate(word, translateTo, function (trans) {
		console.log(trans);
		if (inverse) {
			cardFront.find(".text").text(trans.translate.text[0]);
		} else {
			cardBack.find(".text").text(trans.translate.text[0]);
		}
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
	var cardBackContent = card.back;
	cardBackContent = cardBackContent.replace(/,/g, '<br/>')
	var cardHtml = $("<tr style='width:100%'><td id='"+entry._id+"' style='position:relative;height:100%;text-align:center;vertical-align:middle card'><span class='card-text' style='z-index:10'>"+cardBackContent+"<span></td></tr>");
	
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
		var nextSideContent = card[nextState];
		
		nextSideContent = nextSideContent.replace(/,/g, '<br/>')
		if (stateCounter%3 == 1 /*hint*/) {
			// replacing the front word with stars
			var front = card["front"];
			console.log(nextSideContent.indexOf(front))
			while ((ind=nextSideContent.indexOf(front))!=-1) {
				console.log(nextSideContent)
				var hc = nextSideContent.substring(0, ind) + "<span class='hidden-word'>";
				for (i=0;i<front.length;i++) {
					hc += "*";
				}
				hc += "</span>" + nextSideContent.substring(ind+front.length);
				nextSideContent = hc;
				console.log(nextSideContent)
			}
			
		}
		stateCounter++;
		cardHtml.find(".card-text").html(nextSideContent);
		$(".hidden-word").click(function() {
			$(".hidden-word").text(front);
			return false;
		})
	});
	
	return cardHtml;
}

function startLearning(btn) {

	var row = $('<div class="row-fluid learning-window"></div>');
	var span = $('<div class="span12 full-screen-learning"></div>');
	var table = $("<table style='width:100%;height:100%'></table>");
	
	var card = getNextCard();
	
	if (!card) {
		span.height($(window).height());
		if (cardCounter==0) {
			row.append( span.append(table.append("No cards to learn")) );
		} else {
			row.append( span.append(table.append("No more cards to learn")) );
		}
		$("#before-cards").before(row);
		return;
	}
	
	var progress = '<tr><td style="text-align:center;padding-bottom:10px"><span class="progress" style="font-weight:bold">'+cardCounter+'/'+cards.length+'</span></td></tr>';
	var bar = '<tr><td style="text-align:center;padding-bottom:10px"><button class="btn btn-danger btn-large next-card">Forgot</button><span style="padding:10px"></span><button class="btn btn-warning btn-large next-card">Hard</button><span style="padding:10px"></span><button class="btn btn-success btn-large next-card">Easy</button></td></tr>';
	span.height($(window).height());
	row.append( span.append(table.append(card).append(progress).append(bar)) );

	$("#before-cards").before(row);
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
		if (card) {
			table.find("tr:first").remove();
			table.prepend(card);
			table.find(".progress").text(cardCounter+'/'+cards.length);
		} else {
			span.height($(window).height());
			table.empty().append("<tr><td align='center'>Done</td></tr>");
			return;
		}
	});
}

function moveCardToDict(btn, cardId, offset) {
	var row = $(btn).parents("tr");
	console.log(cardId)
	$.ajax({
	  url: "/card/type",
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


function getProgress() {
	$.ajax({
		  url: "/progress",
		  type: "GET",
		}).done(function( data ) {
			console.log("Progress", data);
			if (!data) return;
			
			var count_total = 46943;
			var score_total = 1000000;
			
			var pr_count_known = parseInt(data.known.count*100/count_total);
			var pr_count_learning = parseInt(data.learning.count*100/count_total);
			var pr_count_unknown = 100-pr_count_known-pr_count_learning;
			var unknown_count = count_total - data.known.count - data.learning.count;
			
			var pr_sf_known = parseInt(data.known.films*100/score_total);
			var pr_sf_learning = parseInt(data.learning.films*100/score_total);
			var pr_sf_unknown = 100-pr_sf_learning-pr_sf_known;
			var unknown_sf_score = score_total - data.learning.films - data.known.films;
			
			var pr_sb_known = parseInt(data.known.books*100/score_total);
			var pr_sb_learning = parseInt(data.learning.books*100/score_total);
			var pr_sb_unknown = 100-pr_sb_learning-pr_sb_known;
			var unknown_sb_score = score_total - data.learning.books - data.known.books;
			
			var data_known_count = pr_count_known + "% (" + parseInt(data.known.count) + ")";
			var data_learning_count = pr_count_learning + "% (" + parseInt(data.learning.count) + ")";
			var data_unknown_count = pr_count_unknown + "% (" + parseInt(unknown_count) + ")";
			
			var data_known_films = pr_sf_known + "% (" + parseInt(data.known.films) + ")";
			var data_learning_films = pr_sf_learning + "% (" + parseInt(data.learning.films) + ")";
			var data_unknown_films = pr_sf_unknown + "% (" + parseInt(unknown_sf_score) + ")";

			var data_known_books = pr_sb_known + "% (" + parseInt(data.known.books) + ")";
			var data_learning_books = pr_sb_learning + "% (" + parseInt(data.learning.books) + ")";
			var data_unknown_books = pr_sb_unknown + "% (" + parseInt(unknown_sb_score) + ")";

			var progressDiv = $("<div id='progress'></div");
			progressDiv.append("Count");
			progressDiv.append(
					'<div class="progress" style="margin-bottom:5px"> <div class="progress-bar progress-bar-success" style="width: '+pr_count_known+'%;" title="'+data_known_count+'">'+data_known_count+
					'</div> <div class="progress-bar progress-bar-warning" style="width: '+pr_count_learning+'%;" title="'+data_learning_count+'">'+data_learning_count+
					'</div>  <div class="progress-bar progress-bar-danger" style="width: '+pr_count_unknown+'%;" title="'+data_unknown_count+'">'+data_unknown_count+'</div></div>');
			progressDiv.append("Films Score");
			progressDiv.append(
					'<div class="progress" style="margin-bottom:5px"> <div class="progress-bar progress-bar-success" style="width: '+pr_sf_known+'%;" title="'+data_known_films+'">'+data_known_films+
					'</div> <div class="progress-bar progress-bar-warning" style="width: '+pr_sf_learning+'%;" title="'+data_learning_films+'">'+data_learning_films+
					'</div>  <div class="progress-bar progress-bar-danger" style="width: '+pr_sf_unknown+'%;" title="'+data_unknown_films+'">'+data_unknown_films+'</div></div>');
			progressDiv.append("Books Score");
			progressDiv.append(
					'<div class="progress" style="margin-bottom:5px"> <div class="progress-bar progress-bar-success" style="width: '+pr_sb_known+'%;" title="'+data_known_books+'">'+data_known_books+
					'</div> <div class="progress-bar progress-bar-warning" style="width: '+pr_sb_learning+'%;" title="'+data_learning_books+'">'+data_learning_books+
					'</div>  <div class="progress-bar progress-bar-danger" style="width: '+pr_sb_unknown+'%;" title="'+data_unknown_books+'">'+data_unknown_books+'</div></div>');
			$("#progress").remove();
			$(".masthead").after(progressDiv);
		});	
}
