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

var nconf = require('nconf');
nconf.argv().env();
nconf.file({ file: 'config.json' });

nconf.defaults({
     "host": "locahost",
     "port": 80
});

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

server.listen(nconf.get("port"));

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
    returnURL: 'http://'+nconf.get('host')+':'+nconf.get("port")+'/auth/google/return',
    realm: 'http://'+nconf.get('host')+':'+nconf.get('port')+'/'
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
	var collectionName = checkUser(req, res);

	var mydict = [];
	db.collection(collectionName, function(err, coll) {
		coll.find({}, {word:true}).toArray(function(err, knownWords) {
			for (i in knownWords) {
				mydict.push(knownWords[i].word);
			}

			db.collection("lexique380", function(err, lexique) {
				lexique.ensureIndex( { "7_freqlemfilms2": 1 } )
				lexique.ensureIndex( { "8_freqlemlivres": 1 } )
				lexique.aggregate([{$group:{"_id": "$3_lemme", "7_freqlemfilms2" : {$max:"$7_freqlemfilms2"}, "8_freqlemlivres" : {$max:"$8_freqlemlivres"}}}, {$match : { _id : {$nin:mydict} }}, {$project:{"3_lemme":1, "7_freqlemfilms2":1, "8_freqlemlivres":1}}, {$sort:{"7_freqlemfilms2":-1}}, {$limit:500}], function(err, topFilmWords) {
					lexique.aggregate([{$group:{"_id": "$3_lemme", "8_freqlemlivres" : {$max:"$8_freqlemlivres"}, "7_freqlemfilms2" : {$max:"$7_freqlemfilms2"}}}, {$match : { _id : {$nin:mydict} }}, {$project:{"3_lemme":1, "8_freqlemlivres":1, "7_freqlemfilms2":1}}, {$sort:{"8_freqlemlivres":-1}}, {$limit:500}], function(err, topBookWords) {
						res.render('home', {'topFilmWords':topFilmWords, 'topBookWords':topBookWords});
					})
				})
			})
		})
	})
});

app.get('/study', ensureAuthenticated, function(req, res) {
	var collectionName = checkUser(req, res);
	var today = new Date().getTime();
	
	db.collection(collectionName, function(err, coll) {
		coll.update({cardtype:"learning", nextDate:{$exists:false}}, {$set: {nextDate:1}}, {safe:true, multi:true}, function(err, updated) {
			console.log("After update");
			console.log(updated);
			console.log(err);
			coll.find({cardtype: "learning", nextDate : {$lt: today}}, { sort : {'_id': -1}}).toArray(function(err, cards) {
				res.render('study', {'cards':cards});
			})
		});
	})	
});

app.get('/cards', ensureAuthenticated, function(req, res) {
	var collectionName = checkUser(req, res);
	db.collection(collectionName, function(err, coll) {
		coll.find({cardtype: "learning"}, { sort : {'_id': -1}}).toArray(function(err, cards) {
			res.render('cards', {'cards':cards});
		})
	})	
});

app.get('/dict', ensureAuthenticated, function(req, res) {
	var collectionName = checkUser(req, res);
	db.collection(collectionName, function(err, coll) {
		coll.find({cardtype: "known"}, { sort : {'_id': -1} }).toArray(function(err, cards) {
			res.render('mydict', {'cards':cards});
		})
	})	
});


function beautify_name(name) {
	return name.replace(/\W/g, '_');
}

function checkUser(req, res) {
	if (req.user && req.user.emails[0] && req.user.emails[0].value) {
		return beautify_name(req.user.emails[0].value);
	}
	res.redirect('/home');
}

function splittext(text, req, res) {
	var collectionName = checkUser(req, res);
	
	var lines = text.split("\n");
	var hasNoSencences = text.indexOf(".")==-1;
	var words = [];
	var words2Sentence = {};
	
	for (l in lines) {
		var sentences = lines[l].split(/[.|!|?]\s/gi);
		for (s in sentences) {
			var sentence = sentences[s];
			var processed = sentence.replace("\n", " ");
			processed = processed.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g, " ");
			var wordsInSentence = processed.split(" ");
			
			for (w in wordsInSentence) {
				var word = wordsInSentence[w].toLowerCase();
				words2Sentence[word] = hasNoSencences?"":sentence+"...";
				words.push(word);
			}
		}
	}

	console.log("Number of words after split " + words.length)
	
	db.collection("lexique380", function(err, lexique) {
		lexique.find({ word: { $in: words }}).toArray(function(err, validWords) {
			var validWordsMap = {};
			var validWordsArr = [];
			for (i in validWords) {
				var infinitiv = validWords[i]["3_lemme"];
				validWordsMap[infinitiv] = validWords[i];
				validWordsMap[infinitiv]["use"] = words2Sentence[validWords[i].word];
				validWordsMap[infinitiv]["original"] = validWords[i].word;
				validWordsArr.push(infinitiv);
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


function createCard(req, res, type) {
	var collectionName = checkUser(req, res);
	var word = req.body.word;
	var card = req.body.card;
	
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
}

app.post('/addword', function(req, res) {
	createCard(req, res, "known");
});

app.post('/card', function(req, res) {
	createCard(req, res, "learning");
});

// SM-2:
// EF (easiness factor) is a rating for how difficult the card is.
// Grade: (0-2) Set reps and interval to 0, keep current EF (repeat card today)
//        (3)   Set interval to 0, lower the EF, reps + 1 (repeat card today)
//        (4-5) Reps + 1, interval is calculated using EF, increasing in time.
function calcIntervalEF(card, grade) {
  if (!card.reps) card.reps = 0;
  if (!card.interval) card.interval = 0;
  if (!card.nextDate) card.nextDate = new Date().getTime();
  if (!card.EF) card.EF = 2.5;

  var oldEF = card.EF, newEF = 0;

  
  if (grade < 3) {
    card.reps = 0;
    card.interval = 0;
  } else {

    newEF = oldEF + (0.1 - (5-grade)*(0.08+(5-grade)*0.02));
    if (newEF < 1.3) { // 1.3 is the minimum EF
      card.EF = 1.3;
    } else {
      card.EF = newEF;
    }

    card.reps = card.reps + 1;

    switch (card.reps) {
      case 1:
        card.interval = 1;
        break;
      case 2:
        card.interval = 6;
        break;
      default:
        card.interval = Math.round((card.reps - 1) * card.EF);
        break;
    }
  }

  if (grade === 3) {
    card.interval = 0;
  }

  var nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + card.interval);
  card.nextDate = nextDate.getTime();
}

app.post('/cardhistory', function(req, res) {
	var collectionName = checkUser(req, res);
	var id = req.body.id;
	var status = req.body.status;
	var grade = 3; // forgot
	if (status.toLowerCase()=="hard") {grade = 4}
	else if (status.toLowerCase()=="easy") {grade = 5}
	
	db.collection(collectionName, function(err, coll) {
		var key = {'_id':new BSON.ObjectID(id)}
		coll.findOne(key, function(err, card) {

			if (card) {	calcIntervalEF(card, grade); }
			if (!card.history) card.history = [];
			card.history.push({'status':status, date:new Date().getTime()});
			
			coll.findAndModify(key, [], card, {new:true}, function(err, result) {
				console.log(result)
				res.send("Successfully modified card " + card.word);
			});
		})
	})
});

app.post('/card/type', function(req, res) {
	var collectionName = checkUser(req, res);
	var id = req.body.id;
	var cardType = req.body.cardType;
	
	db.collection(collectionName, function(err, coll) {
		var key = {'_id':new BSON.ObjectID(id)}
		var data = {'cardtype':cardType, date:new Date().getTime()};
		coll.update(key, {$set:data}, {safe:true}, function(err, result) {
			console.log(result)
			console.log(err)
			res.send(result);
		});
	})
});

app.get('/progress', function(req, res) {
	var collectionName = checkUser(req, res);
	
	db.collection(collectionName, function(err, coll) {
		coll.find({}, {word:true, cardtype:true}).toArray(function(err, knownWords) {
			var mydict = [];
			var wordsMap = {};
			for (i in knownWords) {
				mydict.push(knownWords[i].word);
				wordsMap[knownWords[i].word] = knownWords[i].cardtype; 
			}

			db.collection("lexique380", function(err, lexique) {
				lexique.ensureIndex( { "7_freqlemfilms2": 1 } )
				lexique.ensureIndex( { "8_freqlemlivres": 1 } )
				lexique.find({'3_lemme':{$in:mydict}}, {'3_lemme':true,'7_freqlemfilms2':true, '8_freqlemlivres':true}).toArray(function(err, dic_recs) {
					//console.log("res", dic_recs)
					var cache = {};
					var result = { 
							count: mydict.length,
							learning:{count:0, films:0, books:0},
							known:{count:0, films:0, books:0}}
					
					for (i in dic_recs) {
						var lemm = dic_recs[i]['3_lemme'];
						if (!cache[lemm]) {
							cache[lemm] = 1;
							result[wordsMap[lemm]].books += dic_recs[i]['8_freqlemlivres']
							result[wordsMap[lemm]].films += dic_recs[i]['7_freqlemfilms2']
							result[wordsMap[lemm]].count += 1;
						}
					}
					
					delete mydict;
					delete wordsMap;
					delete cache;
					
					res.send(result)
				})				
			})
		})
	})
});
