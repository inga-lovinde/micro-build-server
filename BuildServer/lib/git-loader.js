"use strict";

var nodegit = require('nodegit'),
	async = require('async'),
	fs = require('fs'),
	fse = require('fs-extra'),
	basename = require('path').basename,
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
		exported = options.exported,
		done = function () {
			globalCallback();
		};

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

		var q = async.queue(function (task, callback) {
			//console.log("Going to write file " + task.path + " (" + task.buffer.length + " bytes)");
			task.entry.getBlob(function (err, blob) {
				if (err) {
					return callback(err);
				}

				fs.writeFile(exported + "/" + task.path, blob.content(), function (err, result) {
					//console.log("Done writing file " + task.path);
					callback(err, result);
				});
			});
		}, 10);

		repo.getCommit(options.hash, function (err, commit) {
			if (err) {
				return globalCallback(err);
			}

			removedirs(exported);
			mkdirs(exported);

			commit.getTree(function (err, tree) {
				if (err) {
					return globalCallback(err);
				}

				tree.walk(false)
					.on('entry', function (entry) {
						if (entry.isTree()) {
							mkdirs(exported + "/" + entry.path());
						} else if (entry.isFile()) {
							q.push({path: entry.path(), entry: entry });
						}
					})
					.on('end', function () {
						if (q.length() === 0) {
							process.nextTick(done);
						} else {
							q.drain = done;
						}
						return;
					})
					.start();
			});
		});
	});
};
