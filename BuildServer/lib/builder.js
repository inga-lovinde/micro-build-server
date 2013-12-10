"use strict";

var fs = require('fs');
var fse = require('fs-extra');
var async = require('async');
var request = require('request');
var gitLoader = require('./git-loader');
var processor = require('./task-processor');
var settings = require('../settings');

var notifyStatus = function (options, callback) {
	var url = "https://github.pos/api/v3/repos/" + options.owner + "/" + options.reponame + "/statuses/" + options.hash;
	request.post(url, {
		auth: settings.getGithubAuth(options.owner),
		json: {
			state: options.state,
			target_url: "https://mbs.pos/status/" + options.owner + "/" + options.reponame + "/" + options.hash,
			description: (options.description || "").substr(0, 140)
		}
	}, function (err, response, body) {
		if (err) {
			console.log("Error: " + err);
			return callback(err);
		}
		console.log("Status code: " + response.statusCode);
		console.log(body);
		if (response.statusCode !== 200) {
			return callback(body);
		}
		return callback();
	});
};

var build = function (options, callback) {
	var url = options.url,
		owner = options.owner,
		reponame = options.reponame,
		rev = options.rev,
		branch = options.branch,
		local = options.app.get('gitpath') + "/" + owner + "/" + reponame + ".git",
		tmp = options.app.get('tmpcodepath') + "/" + rev,
		exported = tmp + "/code",
		release = options.app.get('releasepath') + "/" + owner + "/" + reponame + "/" + branch + "/" + rev,
		statusQueue = async.queue(function (task, callback) {
			task(callback);
		}, 1);

	statusQueue.push(function (callback) {
		notifyStatus({
			state: "pending",
			description: "Preparing to build...",
			owner: owner,
			reponame: reponame,
			hash: rev
		}, callback);
	});

	fse.mkdirsSync(release);

	fs.writeFileSync(options.app.get('releasepath') + "/" + owner + "/" + reponame + "/" + branch + "/latest.id", rev);
	fse.mkdirsSync(options.app.get('releasepath') + "/" + owner + "/" + reponame + "/$revs");
	fs.writeFileSync(options.app.get('releasepath') + "/" + owner + "/" + reponame + "/$revs/" + rev + ".branch", branch);

	var done = function (err, result) {
		var errorMessage = ((result.errors.$allMessages || [])[0] || {}).message,
			warnMessage = ((result.warns.$allMessages || [])[0] || {}).message,
			infoMessage = ((result.infos.$allMessages || [])[0] || {}).message;

		fs.writeFile(release + "/report.json", JSON.stringify({err: err, result: result}), function (writeErr) {
			statusQueue.push(function (callback) {
				notifyStatus({
					state: err ? "error" : "success",
					description: errorMessage || warnMessage || infoMessage || "Success",
					owner: owner,
					reponame: reponame,
					hash: rev
				}, callback);
			});

			if (writeErr) {
				return callback(writeErr);
			}
			return callback(err, result);
		});
	};

	gitLoader({
		remote: url + ".git",
		local: local,
		branch: branch,
		hash: rev,
		exported: tmp + "/code",
	}, function(err) {
		if (err) {
			console.log(err);
			return done("Git fetch error: " + err);
		}
		console.log("Done loading from git");
		fs.exists(exported + "/mbs.json", function (exists) {
			if (!exists) {
				return done(null, "MBSNotFound");
			}
			fs.readFile(exported + "/mbs.json", function (err, data) {
				if (err) {
					return done(err, "MBSUnableToRead");
				}

				var task;
				try {
					task = JSON.parse(data);
				} catch(err) {
					console.log("Malformed data: " + data);
					return done(err, "MBSMalformed");
				}

				processor.processTask(task, {
					owner: owner,
					reponame: reponame,
					branch: branch,
					rev: rev,
					tmp: tmp,
					exported: exported,
					release: release
				}, function (err, result) {
					if (err) {
						return done(err, result);
					}

					return done(err, result);
				});
			});
		});
	});
}

exports.build = build;
