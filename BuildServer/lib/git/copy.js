"use strict";

const EventEmitter = require('events').EventEmitter;
const path = require('path');
const fs = require('fs');
const async = require('async');
const Copier = require('recursive-tree-copy').Copier;

const gitToFsCopier = new Copier({
	concurrency: 4,
	walkSourceTree: function (tree) {
		const emitter = new EventEmitter();
		process.nextTick(function () {
			let entries;
			try {
				entries = tree.gitTree.entries();
			} catch(err) {
				return emitter.emit('error', err);
			}

			async.parallel(entries.map(function (entry) {
				return function (callback) {
					if (entry.isTree()) {
						entry.getTree(function (err, subTree) {
							if (err) {
								return callback(err);
							}

							emitter.emit('tree', { gitTree: subTree, name: entry.name() });
							callback();
						});
					} else if (entry.isFile()) {
						emitter.emit('leaf', entry);
						callback();
					} else {
						callback();
					}
				};
			}), function (err) {
				if (err) {
					return emitter.emit('error', err);
				}

				return emitter.emit('done');
			});
		});
		return emitter;
	},
	createTargetTree: function (tree, targetDir, callback) {
		const targetSubdir = path.join(targetDir, tree.name);
		fs.mkdir(targetSubdir, function (err) {
			if (err && err.code !== 'EEXIST' /* workaround for broken trees */) {
				return callback(err);
			}

			callback(undefined, targetSubdir);
		});
	},
	finalizeTargetTree: function (targetSubdir, callback) {
		callback();
	},
	copyLeaf: function (entry, targetDir, callback) {
		const targetPath = path.join(targetDir, entry.name());
		entry.getBlob(function (err, blob) {
			if (err) {
				return callback(err);
			}

			fs.writeFile(targetPath, blob.content(), callback);
		});
	}
});

exports.gitToFs = function (commit, exportDir, callback) {
	commit.getTree(function (err, tree) {
		if (err) {
			return callback(err);
		}

		gitToFsCopier.copy({ gitTree: tree, name: "." }, exportDir, callback);
	});
};
