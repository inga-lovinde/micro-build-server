"use strict";

var fs = require('fs');
var fse = require('fs-extra');
var gitLoader = require('./git-loader');
var processor = require('./task-processor');

var build = function (options, callback) {
	var url = options.url,
		owner = options.owner,
		reponame = options.reponame,
		rev = options.rev,
		branch = options.branch,
		local = options.app.get('gitpath') + "/" + owner + "/" + reponame + ".git",
		tmp = options.app.get('tmpcodepath') + "/" + owner + "/" + reponame + "/" + branch + "/" + rev,
		exported = tmp + "/code",
		release = options.app.get('releasepath') + "/" + owner + "/" + reponame + "/" + branch + "/" + rev;

	fse.mkdirsSync(release);

	gitLoader({
		remote: url + ".git",
		local: local,
		branch: branch,
		hash: rev,
		exported: tmp + "/code",
	}, function(err) {
		if (err) {
			console.log(err);
		}
		console.log("Done loading from git");
		fs.exists(exported + "/mbs.json", function (exists) {
			if (!exists) {
				return callback(null, "MBSNotFound");
			}
			fs.readFile(exported + "/mbs.json", function (err, data) {
				if (err) {
					return callback(err, "MBSUnableToRead");
				}

				var task;
				try {
					task = JSON.parse(data);
				} catch(err) {
					console.log("Malformed data: " + data);
					return callback(err, "MBSMalformed");
				}

				processor.processTask(task, function (err, result) {
					if (err) {
						return callback(err, result);
					}

					fs.writeFile(release + "/report.json", JSON.stringify(result), function (err) {
						return callback(err, result);
					});
				});
			});
		});
	});
}

exports.build = build;
