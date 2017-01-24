"use strict";

const nodegit = require("nodegit");
const fse = require("fs-extra");
const gitToFs = require("./copy").gitToFs;
const mkdirs = (path) => {
    fse.mkdirsSync(path); // eslint-disable-line no-sync
};
const removedirs = (path) => {
    fse.removeSync(path); // eslint-disable-line no-sync
};

/* Example:
options = {
    "remote": "https://github.com/visionmedia/express.git",
    "local": "D:\\data\\repositories\\visionmedia\\express.git\\",
    "branch": "1.x",
    "hash": "82e15cf321fccf3215068814d1ea1aeb3581ddb3",
    "exported": "D:\\data\\exportedsource\\visionmedia\\express\\82e15cf321fccf3215068814d1ea1aeb3581ddb3\\",
}
 */

module.exports = (options, globalCallback) => {
    let url = options.remote;
    const path = `${options.local}/${options.hash}`;
    const exported = options.exported;

    removedirs(path);
    mkdirs(path);

    if (url.substr(0, 8) === "https://") {
        url = `git://${url.substr(8)}`;
    }

    console.log(`Cloning ${url} to ${path}`);

    nodegit.Repository.init(path, 1)
        .catch(globalCallback)
        .then((repo) => nodegit.Remote.create(repo, "origin", url)
            .catch(globalCallback)
            .then((remote) => remote.fetch([options.branch])
                .catch(globalCallback)
                .then((number) => {
                    if (number) {
                        return globalCallback(`Failed to fetch commit: error number ${number}`);
                    }

                    console.log(`Cloned ${url} to ${path}`);

                    return repo.getCommit(options.hash)
                        .catch(globalCallback)
                        .then((commit) => {
                            removedirs(exported);
                            mkdirs(exported);

                            gitToFs(commit, exported, (err, result) => {
                                repo.free();

                                return globalCallback(err, result);
                            });
                        });
                })));
};
