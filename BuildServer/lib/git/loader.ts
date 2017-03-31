"use strict";

import { mkdirsSync, removeSync } from "fs-extra";
import { Remote, Repository } from "nodegit";

import { gitToFs } from "./copy";

interface IOptions {
    readonly branch: string;
    readonly exported: string;
    readonly hash: string;
    readonly local: string;
    readonly remote: string;
}

interface ISimpleCallback {
    (err?: any): void;
}

const fixUrl = (url: string) => {
    if (!url.startsWith("https://")) {
        return url;
    }

    return `git://${url.substr("https://".length)}`;
};

export const gitLoader = (options: IOptions, globalCallback: ISimpleCallback) => {
    const url = fixUrl(options.remote);
    const path = `${options.local}/${options.hash}`;
    const exported = options.exported;

    removeSync(path);
    mkdirsSync(path);

    console.log(`Cloning ${url} to ${path}`);

    Repository.init(path, 1).then(
        (repo) => Remote.create(repo, "origin", url).then(
            (remote) => remote.fetch([options.branch]).then(
                (errorNumber) => {
                    if (errorNumber) {
                        return globalCallback(`Failed to fetch commit: error number ${errorNumber}`);
                    }

                    console.log(`Cloned ${url} to ${path}`);

                    return repo.getCommit(options.hash).then(
                        (commit) => {
                            removeSync(exported);
                            mkdirsSync(exported);

                            gitToFs(commit, exported, (err) => {
                                repo.free();

                                return globalCallback(err);
                            });
                        },
                        globalCallback,
                    );
                },
                globalCallback,
            ),
            globalCallback,
        ),
        globalCallback,
    );
};
