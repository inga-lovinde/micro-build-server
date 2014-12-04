
/**
 * Module dependencies.
 */

var https = require('https');
var fs = require('fs');

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('gitpath', 'M:/g');
app.set('tmpcodepath', 'M:/c');
app.set('releasepath', 'M:/r');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.post('/github/postreceive', routes.postreceive);
app.get('/github/postreceive', function (req, res) {
	res.send("Only automated POST requests are allowed for postreceive route");
});
app.get('/manual', routes.manual.get);
app.post('/manual', routes.manual.post);
app.get('/status/:owner/:reponame/:branch/:rev?', routes.status.page);
app.get('/status.svg', routes.status.image);
app.get('/release/:owner/:reponame/:branch/:rev', routes.release);
app.get('/artifact/:owner/:reponame/:branch/:rev/*', routes.artifact);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
