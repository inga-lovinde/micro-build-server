"use strict";

var nodegit = require('nodegit'),
	fse = require('fs-extra'),
	gitToFs = require('./copy').gitToFs,
	mkdirs = function (path) {
		/*jslint stupid: true */
		fse.mkdirsSync(path);
	},
	removedirs = function (path) {
		/*jslint stupid: true */
		fse.removeSync(path);
	};

/*
options = {
	"remote": "https://github.com/visionmedia/express.git",
	"local": "D:\\data\\repositories\\visionmedia\\express.git\\",
	"branch": "1.x",
	"hash": "82e15cf321fccf3215068814d1ea1aeb3581ddb3",
	"exported": "D:\\data\\exportedsource\\visionmedia\\express\\82e15cf321fccf3215068814d1ea1aeb3581ddb3\\",
}
*/

module.exports = function (options, globalCallback) {
	var url = options.remote,
		path = options.local + "/" + options.hash,
		exported = options.exported;

	removedirs(path);
	mkdirs(path);

	if (url.substr(0, 8) == "https://") {
		url = "git://" + url.substr(8);
	}

	console.log("Cloning %s to %s", url, path);

	nodegit.Repo.clone(url, path, null /*new nodegit.CloneOptions({"checkout_branch": options.branch})*/, function (err, repo) {
		if (err) {
			return globalCallback(err);
		}

		console.log("Cloned %s to %s", url, path);

		repo.getCommit(options.hash, function (err, commit) {
			if (err) {
				return globalCallback(err);
			}

			removedirs(exported);
			mkdirs(exported);

			gitToFs(commit, exported, globalCallback);
		});
	});
};
