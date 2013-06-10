var express = require('express')
  , util = require('util')
  , http = require('http')
  , passport = require('passport')
  , url = require('url')
  , GoogleStrategy = require('passport-google').Strategy 
  , path = require('path')
  , jsdom = require('jsdom')
  , crypto = require('crypto');

var app = require('express')()
  , server = require('http').createServer(app);

var HOST = "localhost";
var PORT = 8080;

/**
   * Patch the console methods in order to provide timestamp information
   */
(function(o){
  if(o.__ts__){return;}
  var slice = Array.prototype.slice;
  ['log', 'debug', 'info', 'warn', 'error'].forEach(function(f){
    var _= o[f];
    o[f] = function(){
      var args = slice.call(arguments);
      args.unshift(new Date().toISOString());
      return _.apply(o, args);
    };
  });
  o.__ts__ = true;
})(console);

server.listen(PORT);

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'supersecret' }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Use the GoogleStrategy within Passport.
//   Strategies in passport require a `validate` function, which accept
//   credentials (in this case, an OpenID identifier and profile), and invoke a
//   callback with a user object.
passport.use(new GoogleStrategy({
    returnURL: 'http://'+HOST+':'+PORT+'/auth/google/return',
    realm: 'http://'+HOST+':'+PORT+'/'
  },
  function(identifier, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Google account with a user record in your database,
      // and return that user instead.
      profile.identifier = identifier;
      return done(null, profile);
    });
  }
));
  

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve redirecting
//   the user to google.com.  After authenticating, Google will redirect the
//   user back to this application at /auth/google/return
app.get('/auth/google', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
  	console.log("auth");
  	console.log(req.user);
    res.redirect('/home');
});

// GET /auth/google/return
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/google/return', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
  	console.log("auth return");
  	console.log(req.user);
    res.redirect('/home');
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
  	console.log(req.user); 
  	return next(); 
  }
  console.log("Non-authenticated user"); 
  res.redirect('/auth/google')
}

var mongo = require('mongodb');
 
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
 
var server = new Server('localhost', 27017, {auto_reconnect: true});
var dmName = "mydict";
db = new Db(dmName, server);

db.open(function(err, db) {
    if(!err) {
        console.log("Connected to '"+dmName+"' database");
    }
});

app.get('/home', ensureAuthenticated, function(req, res) {
	res.render('home');
});

app.get('/study', ensureAuthenticated, function(req, res) {
	var collectionName = checkUser(req);
	db.collection(collectionName, function(err, coll) {
		coll.find({cardtype: "learning"}, { sort : {'_id': -1}}).toArray(function(err, cards) {
			res.render('study', {'cards':cards});
		})
	})	
});

app.get('/mydict', ensureAuthenticated, function(req, res) {
	var collectionName = checkUser(req);
	db.collection(collectionName, function(err, coll) {
		coll.find({cardtype: "known"}, { sort : {'_id': -1} }).toArray(function(err, cards) {
			res.render('mydict', {'cards':cards});
		})
	})	
});

app.get('/translate', function(req, res) {
	var options = {host: "slovari.yandex.ru", path: "/"+req.query.word+"/fr/"}
	console.log(options);
	
	http.get(options, function (http_res) {
	    var data = "";
	    http_res.on("data", function (chunk) {
	        data += chunk;
	    });
	    http_res.on("end", function () {
			jsdom.env({
			    html: data,
			    scripts: [
			      'http://code.jquery.com/jquery-1.5.min.js'
			    ]
			  }, function (err, window) {
			    var $ = window.jQuery;
			    res.send("<div>"+$('.b-translation__tr').first().html()+"</div>" + $('.b-translation__article').first().html());
			  });
	    });
	});
});

function beautify_name(name) {
	return name.replace(/\W/g, '_');
}

function checkUser(req) {
	if (req.user && req.user.emails[0] && req.user.emails[0].value) {
		return beautify_name(req.user.emails[0].value);
	}
	res.redirect('/home');
}

function splittext(text, req, res) {
	var collectionName = checkUser(req);
	
	var sentences = text.split(/[.|!|?]\s/gi);
	var hasNoSencences = text.indexOf(".")==-1;
	var words = [];
	var words2Sentence = {};
	
	for (i in sentences) {
		
		var sentence = sentences[i];
		var processed = sentence.replace("\n", " ");
		processed = processed.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g, " ");
		var wordsInSentence = processed.split(" ");
		
		for (j in wordsInSentence) {
			words2Sentence[wordsInSentence[j]] = hasNoSencences?"":sentence+"...";
			words.push(wordsInSentence[j]);
		}
	}

	console.log("Number of words after split " + words.length)
	
	db.collection("lexique380", function(err, lexique) {
		lexique.find({ word: { $in: words }}).toArray(function(err, validWords) {
			var validWordsMap = {};
			var validWordsArr = [];
			for (i in validWords) {
				validWordsMap[validWords[i].word] = validWords[i];
				validWordsMap[validWords[i].word]["use"] = words2Sentence[validWords[i].word];
				validWordsArr.push(validWords[i].word);
			}
		
			console.log("Number of valid words " + validWords.length);
	
			db.collection(collectionName, function(err, coll) {
				coll.ensureIndex( { "word": 1 } )
				coll.find({ word: { $in: validWordsArr }}, {word:true, cardtype:true}).toArray(function(err, knownWords) {
					for (i in knownWords) {
						validWordsMap[knownWords[i].word]["cardtype"]=knownWords[i].cardtype;
					}
					res.send(validWordsMap);
				})
			})
		})
	})
}

app.post('/splittext', function(req, res) {
	var text = req.body.text;
	if (text.indexOf("http")==0) {
		var link = url.parse(text);
		var options = {host: link.host, port: link.port, path: link.path}
		console.log(options);
		
		http.get(options, function (http_res) {
		    var data = "";
		    http_res.on("data", function (chunk) {
		        data += chunk;
		    });
		    http_res.on("end", function () {
				splittext(data, req, res);
		        console.log(data);
		    });
		});
	} else {
		splittext(text, req, res);
	}
});


app.post('/addword', function(req, res) {
	var collectionName = checkUser(req);
	var word = req.body.word;
	var card = req.body.card;
	var type = req.body.cardtype;
	
	if (!req.body.word || req.body.word.length==0) {
		return false;
	}
	
	db.collection(collectionName, function(err, coll) {
		var key = {'word':word}
		var data = {'word':word, 'card':card, 'cardtype':type, date:new Date().getTime()};
		coll.update(key, data, {upsert:true, safe:true}, function(err, result) {
			console.log("Successfully added " + word)
			res.send("Successfully added " + word);
		});
	})
});
