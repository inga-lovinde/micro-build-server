"use strict";

const nodegit = require('nodegit');
const fse = require('fs-extra');
const gitToFs = require('./copy').gitToFs;
const mkdirs = function (path) {
	/*jslint stupid: true */
	fse.mkdirsSync(path);
};
const removedirs = function (path) {
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
	let url = options.remote;
	const path = options.local + "/" + options.hash;
	const exported = options.exported;

	removedirs(path);
	mkdirs(path);

	if (url.substr(0, 8) === "https://") {
		url = "git://" + url.substr(8);
	}

	console.log("Cloning %s to %s", url, path);

	nodegit.Repository.init(path, 1)
		.catch(globalCallback)
		.then(function (repo) {
			nodegit.Remote.create(repo, "origin", url)
				.catch(globalCallback)
				.then(function (remote) {
					remote.fetch([options.branch])
						.catch(globalCallback)
						.then(function (number) {
							if (number) {
								return globalCallback("Failed to fetch commit: error number " + number);
							}

							console.log("Cloned %s to %s", url, path);

							repo.getCommit(options.hash)
								.catch(globalCallback)
								.then(function (commit) {
									removedirs(exported);
									mkdirs(exported);

									gitToFs(commit, exported, function (err, result) {
										repo.free();
										return globalCallback(err, result);
									});
								});
						});
				});
		});
};
