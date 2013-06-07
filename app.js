var express = require('express')
  , util = require('util')
  , http = require('http')
  , passport = require('passport')
  , util = require('util')
  , GoogleStrategy = require('passport-google').Strategy 
  , path = require('path')
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
    returnURL: 'http://'+HOST+'/auth/google/return',
    realm: 'http://'+HOST+'/'
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

app.get('/dashboard', ensureAuthenticated, function(req, res) {
	var id = beautify_name(req.user.emails[0].value);
	db.collection("accounts", function(err, coll) {
		coll.findOne({'id':id}, function(err, account) {
			if (!account) {
				console.log("Creating new account for " + id);
				var statistics = {last12month:[], last30days:[], last24hours:[]};				
				
				coll.insert({'id': id, user: req.user, adminkey:guid(),clientkey:guid()}, {safe:true}, function(err, a) {
					res.render('dashboard', { 'account': a[0] });
					console.log("Client key is " + a.clientkey);
					coll.ensureIndex({id:1, adminkey:1, clientkey:1}, function(err,ind){});
				});
				db.createCollection("stats_"+id+"_year", {capped:true, size:100000, max:12}, function(e,c){});
				db.createCollection("stats_"+id+"_month", {capped:true, size:100000, max:30}, function(e,c){});
				db.createCollection("stats_"+id+"_day", {capped:true, size:100000, max:24}, function(e,c){});
			} else {
				res.render('dashboard', { 'account': account });
			}
		});
    });	
});

