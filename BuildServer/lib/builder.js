"use strict";

var fs = require('fs');
var fse = require('fs-extra');
var async = require('async');
var gitLoader = require('./git/loader');
var processor = require('./task-processor');
var mailSender = require('./mail-sender');
var settings = require('../settings');

//var codePostfix = "/code";
var codePostfix = "";

var notifyStatus = function (options, callback) {
	var status = {
		user: options.owner,
		repo: options.reponame,
		sha: options.hash,
		state: options.state,
		target_url: settings.siteRoot + "status/" + options.owner + "/" + options.reponame + "/" + options.hash,
		description: ((options.description || "") + "").substr(0, 140)
	};
	settings.createGithub(options.owner).statuses.create(status, function (err, result) {
		if (err) {
			console.log("Error while creating status: " + err);
			console.log(status);
			return callback(err);
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
		skipGitLoader = options.skipGitLoader,
		local = options.app.get('gitpath') + "/r/",
		tmp = options.app.get('tmpcodepath') + "/" + rev.substr(0, 20),
		exported = tmp + codePostfix,
		release = options.app.get('releasepath') + "/" + owner + "/" + reponame + "/" + branch + "/" + rev,
		statusQueue = async.queue(function (task, callback) {
			task(callback);
		}, 1),
		actualGitLoader = skipGitLoader ? function(options, callback) { process.nextTick(callback); } : gitLoader;

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
		var errorMessage = result && result.errors ? ((result.errors.$allMessages || [])[0] || {}).message : err,
			warnMessage = result && result.warns ? ((result.warns.$allMessages || [])[0] || {}).message : err,
			infoMessage = result && result.infos ? ((result.infos.$allMessages || []).slice(-1)[0] || {}).message : err;

		fs.writeFile(release + "/report.json", JSON.stringify({date: Date.now(), err: err, result: result}), function (writeErr) {
			statusQueue.push(function (callback) {
				async.parallel([
					function (callback) {
						notifyStatus({
							state: err ? "error" : "success",
							description: errorMessage || warnMessage || infoMessage || "Success",
							owner: owner,
							reponame: reponame,
							hash: rev
						}, callback);
					},
					function (callback) {
						return process.nextTick(callback);
						mailSender.send({
							from: settings.smtp.sender,
							to: settings.smtp.receiver,
							subject: (err ? "Build failed for " : "Successfully built ") + owner + "/" + reponame + "/" + branch,
							headers: {
								'X-Laziness-level': 1000
							},
							text: ("Build status URL: " + settings.siteRoot + "status/" + owner + "/" + reponame + "/" + rev + "\r\n\r\n") +
								(err ? ("Error message: " + err + "\r\n\r\n") : "") +
								((!result || !result.messages || !result.messages.$allMessages) ? JSON.stringify(result, null, 4) : result.messages.$allMessages.map(function (msg) { return msg.prefix + "\t" + msg.message; }).join("\r\n"))
						}, callback);
					},
					function (callback) {
						if (err) {
							return process.nextTick(callback);
						}

						return fse.remove(tmp, callback);
					}
				], callback);
			});

			if (writeErr) {
				return callback(writeErr);
			}
			return callback(err, result);
		});
	};

	actualGitLoader({
		remote: url + ".git",
		local: local,
		branch: branch,
		hash: rev,
		exported: tmp + codePostfix
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
				} catch(ex) {
					console.log("Malformed data: " + data);
					return done(ex, "MBSMalformed");
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
};

exports.build = build;
