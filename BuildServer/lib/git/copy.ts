"use strict";

import { parallel } from "async";
import { EventEmitter } from "events";
import { mkdir, writeFile } from "fs";
import { Commit, Tree, TreeEntry } from "nodegit";
import { join } from "path";
import { createCopier } from "recursive-tree-copy";

interface ISource {
    gitTree: Tree;
    name: string;
}

interface ISimpleCallback {
    (err?: any): void;
}

interface INewTreeCallback {
    (err: any, newTree?: string): void;
}

const safeGetEntries = (tree: ISource, callback: (err: any, entries?: TreeEntry[]) => void) => {
    try {
        return callback(null, tree.gitTree.entries());
    } catch (err) {
        return callback(err);
    }
};

const gitToFsCopier = createCopier({
    concurrency: 4,
    copyLeaf: (entry: TreeEntry, targetDir: string, callback: ISimpleCallback) => {
        const targetPath = join(targetDir, entry.name());

        entry.getBlob((err, blob) => {
            if (err || !blob) {
                return callback(err);
            }

            return writeFile(targetPath, blob.content(), callback);
        });
    },
    createTargetTree: (tree: ISource, targetDir: string, callback: INewTreeCallback) => {
        const targetSubdir = join(targetDir, tree.name);

        mkdir(targetSubdir, (err) => {
            // Workaround for broken trees
            if (err && err.code !== "EEXIST") {
                return callback(err);
            }

            return callback(null, targetSubdir);
        });
    },
    finalizeTargetTree: (_targetSubdir: string, callback: ISimpleCallback) => callback(),
    walkSourceTree: (tree: ISource) => {
        const emitter = new EventEmitter();

        process.nextTick(() => safeGetEntries(tree, (getEntriesErr, entries) => {
            if (getEntriesErr || !entries) {
                return emitter.emit("error", getEntriesErr);
            }

            return parallel(entries.map((entry) => (callback: ISimpleCallback) => {
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

export const gitToFs = (commit: Commit, exportDir: string, callback: ISimpleCallback) => commit.getTree().then(
    (tree) => gitToFsCopier.copy({
        gitTree: tree,
        name: ".",
    }, exportDir, callback),
    (err) => callback(err),
);
