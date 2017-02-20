"use strict";

const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
const async = require("async");
const gitLoader = require("./git/loader");
const processor = require("./task-processor");
const reportProcessor = require("./report-processor");
const mailSender = require("./mail-sender");
const settings = require("../settings");

const codePostfix = "";
const mailLazinessLevel = 1000;
const maxDescriptionLength = 140;
const maxTmpcodepathLength = 15;
const twoDigits = 100;

const createFinalState = (isSuccess) => {
    if (isSuccess) {
        return "success";
    }

    return "error";
};

const createBuildDoneMessage = (isSuccess, name) => {
    if (isSuccess) {
        return `Successfully built ${name}`;
    }

    return `Build failed for ${name}`;
};

const notifyStatus = (options, notifyStatusCallback) => {
    const status = {
        "description": String(options.description || "").substr(0, maxDescriptionLength),
        "owner": options.owner,
        "repo": options.reponame,
        "sha": options.hash,
        "state": options.state,
        "target_url": `${settings.siteRoot}status/${options.owner}/${options.reponame}/${options.hash}`
    };

    settings.createGithub(options.owner).repos.createStatus(status, (createStatusErr) => {
        if (createStatusErr) {
            console.log(`Error while creating status: ${createStatusErr}`);
            console.log(status);

            return notifyStatusCallback(createStatusErr);
        }

        return notifyStatusCallback();
    });
};

const wrapGitLoader = (skipGitLoader) => {
    if (!skipGitLoader) {
        return gitLoader;
    }

    return (gitLoaderOptions, gitLoaderCallback) => process.nextTick(gitLoaderCallback);
};

const safeParseJson = (data) => {
    try {
        return { "parsed": JSON.parse(data) };
    } catch (err) {
        return { err };
    }
};

const build = (options, buildCallback) => {
    const url = options.url;
    const owner = options.owner;
    const reponame = options.reponame;
    const rev = options.rev;
    const branch = options.branch;
    const skipGitLoader = options.skipGitLoader;
    const local = path.join(options.app.get("gitpath"), "r");
    const tmp = path.join(options.app.get("tmpcodepath"), rev.substr(0, maxTmpcodepathLength));
    const exported = tmp + codePostfix;
    const release = path.join(options.app.get("releasepath"), owner, reponame, branch, rev);
    const statusQueue = async.queue((task, queueCallback) => task(queueCallback), 1);
    const actualGitLoader = wrapGitLoader(skipGitLoader);
    const date = new Date();
    const versionMajor = date.getFullYear();
    const versionMinor = date.getMonth() + 1;
    const versionBuild = date.getDate();
    const versionRev = (date.getHours() * twoDigits) + date.getMinutes();
    const version = `${versionMajor}.${versionMinor}.${versionBuild}.${versionRev}`;
    const versionInfo = `${version}; built from ${rev}; repository: ${owner}/${reponame}; branch: ${branch}`;

    statusQueue.push((queueCallback) => notifyStatus({
        "description": "Preparing to build...",
        "hash": rev,
        owner,
        reponame,
        "state": "pending"
    }, queueCallback));

    fse.mkdirsSync(release);

    fs.writeFileSync(path.join(options.app.get("releasepath"), owner, reponame, branch, "latest.id"), rev);
    fse.mkdirsSync(path.join(options.app.get("releasepath"), owner, reponame, "$revs"));
    fs.writeFileSync(path.join(options.app.get("releasepath"), owner, reponame, "$revs", `${rev}.branch`), branch);

    const createErrorMessageForMail = (doneErr) => {
        if (!doneErr) {
            return "";
        }

        return `Error message: ${doneErr}\r\n\r\n`;
    };

    const createResultMessageForMail = (result) => {
        if (!result || !result.messages || !result.messages.$allMessages) {
            return JSON.stringify(result, null, "    ");
        }

        return result.messages.$allMessages.map((msg) => `${msg.prefix}\t${msg.message}`).join("\r\n");
    };

    const done = (doneErr, result) => {
        const allErrors = ((result || {}).errors || {}).$allMessages || [];
        const allWarns = ((result || {}).warns || {}).$allMessages || [];
        const allInfos = ((result || {}).infos || {}).$allMessages || [];
        const errorMessage = (allErrors[0] || {}).message || doneErr;
        const warnMessage = (allWarns[0] || {}).message;
        const infoMessage = (allInfos[allInfos.length - 1] || {}).message;

        reportProcessor.writeReport(release, doneErr, result, (writeErr) => {
            statusQueue.push((queueCallback) => async.parallel([
                (parallelCallback) => notifyStatus({
                    "description": errorMessage || warnMessage || infoMessage || "Success",
                    "hash": rev,
                    owner,
                    reponame,
                    "state": createFinalState(!doneErr)
                }, parallelCallback),
                (parallelCallback) => mailSender.send({
                    "from": settings.smtp.sender,
                    "headers": { "X-Laziness-level": mailLazinessLevel },
                    "subject": createBuildDoneMessage(doneErr, `${owner}/${reponame}/${branch}`),
                    "text": `Build status URL: ${settings.siteRoot}status/${owner}/${reponame}/${rev}\r\n\r\n${createErrorMessageForMail(doneErr)}${createResultMessageForMail(result)}`,
                    "to": settings.smtp.receiver
                }, parallelCallback),
                (parallelCallback) => {
                    if (doneErr) {
                        return process.nextTick(parallelCallback);
                    }

                    return fse.remove(tmp, parallelCallback);
                }
            ], queueCallback));

            if (writeErr) {
                return buildCallback(writeErr);
            }

            return buildCallback(doneErr, result);
        });
    };

    actualGitLoader({
        branch,
        exported,
        "hash": rev,
        local,
        "remote": `${url}.git`
    }, (gitLoaderErr) => {
        if (gitLoaderErr) {
            console.log(gitLoaderErr);

            return done(`Git fetch error: ${gitLoaderErr}`);
        }

        console.log("Done loading from git");

        return fs.exists(path.join(exported, "mbs.json"), (exists) => {
            if (!exists) {
                return done(null, "MBSNotFound");
            }

            return fs.readFile(path.join(exported, "mbs.json"), (readErr, data) => {
                if (readErr) {
                    return done(readErr, "MBSUnableToRead");
                }

                const { parsed, err } = safeParseJson(data);

                if (err) {
                    console.log(`Malformed data: ${data}`);

                    return done(err, "MBSMalformed");
                }

                return processor.processTask(parsed, {
                    branch,
                    exported,
                    owner,
                    release,
                    reponame,
                    rev,
                    tmp,
                    versionInfo
                }, (processErr, result) => {
                    if (processErr) {
                        return done(processErr, result);
                    }

                    return done(processErr, result);
                });
            });
        });
    });
};

exports.build = build;
