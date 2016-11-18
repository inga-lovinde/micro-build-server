"use strict";

const EventEmitter = require('events').EventEmitter;
const path = require('path');
const fs = require('fs');
const async = require('async');
const Copier = require('recursive-tree-copy').Copier;

const gitToFsCopier = new Copier({
	concurrency: 4,
	walkSourceTree: (tree) => {
		const emitter = new EventEmitter();
		process.nextTick(() => {
			let entries;
			try {
				entries = tree.gitTree.entries();
			} catch(err) {
				return emitter.emit('error', err);
			}

			async.parallel(entries.map((entry) => (callback) => {
				if (entry.isTree()) {
					entry.getTree((err, subTree) => {
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
			}), (err) => {
				if (err) {
					return emitter.emit('error', err);
				}

				return emitter.emit('done');
			});
		});
		return emitter;
	},
	createTargetTree: (tree, targetDir, callback) => {
		const targetSubdir = path.join(targetDir, tree.name);
		fs.mkdir(targetSubdir, (err) => {
			if (err && err.code !== 'EEXIST' /* workaround for broken trees */) {
				return callback(err);
			}

			callback(undefined, targetSubdir);
		});
	},
	finalizeTargetTree: (targetSubdir, callback) => callback(),
	copyLeaf: (entry, targetDir, callback) => {
		const targetPath = path.join(targetDir, entry.name());
		entry.getBlob((err, blob) => {
			if (err) {
				return callback(err);
			}

			fs.writeFile(targetPath, blob.content(), callback);
		});
	}
});

exports.gitToFs = (commit, exportDir, callback) => commit.getTree((err, tree) => {
	if (err) {
		return callback(err);
	}

	gitToFsCopier.copy({ gitTree: tree, name: "." }, exportDir, callback);
});
