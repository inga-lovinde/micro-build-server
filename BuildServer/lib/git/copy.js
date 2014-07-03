"use strict";

var nodegit = require('nodegit'),
	async = require('async'),
	fs = require('fs'),
	fse = require('fs-extra'),
	mkdirs = function (path) {
		/*jslint stupid: true */
		fse.mkdirsSync(path);
	},
	removedirs = function (path) {
		/*jslint stupid: true */
		fse.removeSync(path);
	};

exports.gitToFs = function (commit, exportDir, globalCallback) {
	var q = async.queue(function (task, callback) {
		//console.log("Going to write file " + task.path + " (" + task.buffer.length + " bytes)");
		task.entry.getBlob(function (err, blob) {
			if (err) {
				return callback(err);
			}

			fs.writeFile(exportDir + "/" + task.path, blob.content(), function (err, result) {
				//console.log("Done writing file " + task.path);
				callback(err, result);
			});
		});
	}, 10);

	commit.getTree(function (err, tree) {
		if (err) {
			return globalCallback(err);
		}

		tree.walk(false)
			.on('entry', function (entry) {
				if (entry.isTree()) {
					mkdirs(exportDir + "/" + entry.path());
				} else if (entry.isFile()) {
					q.push({path: entry.path(), entry: entry });
				}
			})
			.on('end', function () {
				if (q.length() === 0) {
					process.nextTick(globalCallback);
				} else {
					q.drain = globalCallback;
				}
				return;
			})
			.start();
	});
};
