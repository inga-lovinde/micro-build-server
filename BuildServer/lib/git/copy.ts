"use strict";

import { parallel } from "async";
import { EventEmitter } from "events";
import { mkdir, writeFile } from "fs";
import { join } from "path";
import { Copier } from "recursive-tree-copy";

const safeGetEntries = (tree, callback) => {
    try {
        return callback(null, tree.gitTree.entries());
    } catch (err) {
        return callback(err);
    }
};

const gitToFsCopier = new Copier({
    concurrency: 4,
    copyLeaf: (entry, targetDir, callback) => {
        const targetPath = join(targetDir, entry.name());

        entry.getBlob((err, blob) => {
            if (err) {
                return callback(err);
            }

            return writeFile(targetPath, blob.content(), callback);
        });
    },
    createTargetTree: (tree, targetDir, callback) => {
        const targetSubdir = join(targetDir, tree.name);

        mkdir(targetSubdir, (err) => {
            // Workaround for broken trees
            if (err && err.code !== "EEXIST") {
                return callback(err);
            }

            return callback(null, targetSubdir);
        });
    },
    finalizeTargetTree: (_targetSubdir, callback) => callback(),
    walkSourceTree: (tree) => {
        const emitter = new EventEmitter();

        process.nextTick(() => safeGetEntries(tree, (getEntriesErr, entries) => {
            if (getEntriesErr) {
                return emitter.emit("error", getEntriesErr);
            }

            return parallel(entries.map((entry) => (callback) => {
                if (entry.isTree()) {
                    return entry.getTree((getTreeErr, subTree) => {
                        if (getTreeErr) {
                            return callback(getTreeErr);
                        }

                        emitter.emit("tree", {
                            gitTree: subTree,
                            name: entry.name(),
                        });

                        return callback();
                    });
                }

                if (entry.isFile()) {
                    emitter.emit("leaf", entry);

                    return callback();
                }

                return callback();
            }), (parallelErr) => {
                if (parallelErr) {
                    return emitter.emit("error", parallelErr);
                }

                return emitter.emit("done");
            });
        }));

        return emitter;
    },
});

export const gitToFs = (commit, exportDir, callback) => commit.getTree((err, tree) => {
    if (err) {
        return callback(err);
    }

    return gitToFsCopier.copy({
        gitTree: tree,
        name: ".",
    }, exportDir, callback);
});
