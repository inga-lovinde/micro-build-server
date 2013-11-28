"use strict";

var git = require('git-node'),
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
		remote = git.remote(url),
		path = options.local + "/" + options.hash,
		repo = git.repo(path),
		exported = options.exported,
		opts = {
			want: options.branch/*,
			onProgress: function (progress) {
				process.stderr.write(progress);
			}*/
		},
		done = function () {
			globalCallback();
		};

	mkdirs(path);

	//console.log("Cloning %s to %s", url, path);

	repo.fetch(remote, opts, function (err) {
		if (err) {
			return globalCallback(err);
		}

		//console.log("Done fetching");

		removedirs(exported);
		mkdirs(exported);

		var q = async.queue(function (task, callback) {
			//console.log("Going to write file " + task.path + " (" + task.buffer.length + " bytes)");
			fs.writeFile(exported + "/" + task.path, task.buffer, function (err, result) {
				//console.log("Done writing file " + task.path);
				callback(err, result);
			});
		}, 10);

		repo.treeWalk(options.hash, function (err, tree) {
			if (err) {
				return globalCallback(err);
			}

			var onEntry = function (err, entry) {
				if (err) {
					return globalCallback(err);
				}

				if (!entry) {
					if (q.length() === 0) {
						process.nextTick(done);
					} else {
						q.drain = done;
					}
					return;
				}
				//console.log(" %s %s (%s)", entry.hash, entry.path, entry.type);
				if (entry.type === "tree") {
					mkdirs(exported + "/" + entry.path);
				} else if (entry.type === "blob") {
					q.push({path: entry.path, buffer: entry.body });
				}
				return tree.read(onEntry);
			};

			tree.read(onEntry);
		});
	});
};
