var tranapi = {
	translate : function(sourceText, translated_language, callbackFunc){		
		//usage deprecated google api request:
		//var request_string = 'https://www.googleapis.com/language/translate/v2?key=AIzaSyBal3n8McSavjhYeZ39GUiGg7FLjsepY9s&target=' + translated_language + '&q=' + sourceText;
		
		//usage microsoft transalte api:
		//http://api.microsofttranslator.com/V2/Ajax.svc/Translate?oncomplete=mycallback&appId=ECDF09E7A81FD776CE912017D3C1AD3017D4D297&to=ru&text=%D0%9C%D0%BE%D0%B9%20%D1%82%D0%B5%D0%BA%D1%81%D1%82%20One%20by%20One
		//var request_string = 'http://api.microsofttranslator.com/V2/Ajax.svc/Translate?appId=ECDF09E7A81FD776CE912017D3C1AD3017D4D297&to=' + translated_language + '&text=' + sourceText;
		var api = 'trnsl.1.1.20130612T074508Z.d31b91064d39ef42.06cb993eeaf031b05b465b62435428359d95328f';
		var request_string = 'https://translate.yandex.net/api/v1.5/tr.json/translate?key='+api+'&format=html&options=1&lang='+translated_language+'&text='+sourceText;
		//http://api.microsofttranslator.com/V2/Ajax.svc/Translate?oncomplete=mycallback&appId=ECDF09E7A81FD776CE912017D3C1AD3017D4D297&to=ru&text=Мой текст One by One
		//alert("req" + request_string);
		//console.log("tranapi: request string: " + request_string);	
		$.ajax({
			type: "GET",
			crossDomain: true,
		    url: request_string,             // указываем URL и
		    dataType : "json",                     // тип загружаемых данных
		    success: function (data, textStatus) {	    	
		    	// вешаем свой обработчик на функцию success
		    	//alert("succ data: " + data + " st: " + textStatus);
		    	var translatedText = data;		 
		        var outData = {"sourceText": sourceText, "translate":translatedText};
		        callbackFunc(outData);
		        
		    },
		    error: function(data, textStatus) {
		    	//alert("error: data: " + data + " st: " + textStatus);
		    	var error = data.statusText + ". Error code:" + data.status;
		    	//console.log("tranapi error:  data.statusText: " + data.statusText);		    
		    	var outData = {"sourceText": sourceText, "translate": undefined};
			    callbackFunc(outData);		    	
		    }		    
		});			
	}
	
};
//undocumented google dict api:
/*
 * http://www.google.com/dictionary/json?callback=dict_api.callbacks.id100&q=test&sl=en&tl=en&restrict=pr%2Cde&client=te * 
 */

//document but raw google api
/*
 * https://ajax.googleapis.com/ajax/services/language/translate?v=1.0&q=Hello,%20my%20dear%20friend!&langpair=en|ru
 * 
*/
