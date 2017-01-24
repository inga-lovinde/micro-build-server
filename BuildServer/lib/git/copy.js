"use strict";

const EventEmitter = require("events").EventEmitter;
const path = require("path");
const fs = require("fs");
const async = require("async");
const Copier = require("recursive-tree-copy").Copier;

const gitToFsCopier = new Copier({
    "concurrency": 4,
    "copyLeaf": (entry, targetDir, callback) => {
        const targetPath = path.join(targetDir, entry.name());

        entry.getBlob((err, blob) => {
            if (err) {
                return callback(err);
            }

            return fs.writeFile(targetPath, blob.content(), callback);
        });
    },
    "createTargetTree": (tree, targetDir, callback) => {
        const targetSubdir = path.join(targetDir, tree.name);

        fs.mkdir(targetSubdir, (err) => {
            // Workaround for broken trees
            if (err && err.code !== "EEXIST") {
                return callback(err);
            }

            return callback(null, targetSubdir);
        });
    },
    "finalizeTargetTree": (targetSubdir, callback) => callback(),
    "walkSourceTree": (tree) => {
        const emitter = new EventEmitter();

        process.nextTick(() => {
            let entries = null;

            try {
                entries = tree.gitTree.entries();
            } catch (err) {
                return emitter.emit("error", err);
            }

            return async.parallel(entries.map((entry) => (callback) => {
                if (entry.isTree()) {
                    return entry.getTree((err, subTree) => {
                        if (err) {
                            return callback(err);
                        }

                        emitter.emit("tree", {
                            "gitTree": subTree,
                            "name": entry.name()
                        });

                        return callback();
                    });
                }

                if (entry.isFile()) {
                    emitter.emit("leaf", entry);

                    return callback();
                }

                return callback();
            }), (err) => {
                if (err) {
                    return emitter.emit("error", err);
                }

                return emitter.emit("done");
            });
        });

        return emitter;
    }
});

exports.gitToFs = (commit, exportDir, callback) => commit.getTree((err, tree) => {
    if (err) {
        return callback(err);
    }

    return gitToFsCopier.copy({
        "gitTree": tree,
        "name": "."
    }, exportDir, callback);
});
