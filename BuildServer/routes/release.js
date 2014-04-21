"use strict";

var path = require('path');
var Zip = require('adm-zip');

module.exports = function(req, res, next) {
	var options = {
		owner: req.params.owner,
		reponame: req.params.reponame,
		branchName: req.params.branch,
		branch: "/refs/heads/" + req.params.branch,
		rev: req.params.rev
	};

	var zip = new Zip(),
		releasePath = path.normalize(req.app.get('releasepath') + "/" + options.owner + "/" + options.reponame + "/" + options.branch + "/" + options.rev + "/");

	zip.addLocalFolder(releasePath);
	zip.toBuffer(function (buffer) {
		res.attachment(options.reponame + '.' + options.rev + '.zip', '.');
		res.send(buffer);
	}, function (error) {
		next(error);
	}, function () { }, function () { });
};
