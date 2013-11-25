
/**
 * Module dependencies.
 */

var https = require('https');
var fs = require('fs');

https.globalAgent.options.ca = https.globalAgent.options.ca || [];
https.globalAgent.options.ca.push(fs.readFileSync("POS-CA.crt"));

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('gitpath', 'D:/data/mbs/git');
app.set('tmpcodepath', 'D:/data/mbs/code');
app.set('releasepath', 'D:/data/mbs/release');
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
app.get('/manual', routes.manual.get);
app.post('/manual', routes.manual.post);
app.get('/status/:owner/:reponame/:branch/:rev', routes.status.image);
app.get('/status.svg', routes.status.image);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
