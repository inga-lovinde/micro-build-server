"use strict";

import { parallel, queue } from "async";
import { exists, readFile, writeFileSync } from "fs";
import { mkdirsSync, remove } from "fs-extra";
import * as JSONParse from "json-parse-safe";
import { join } from "path";

import { gitLoader } from "./git/loader";
import { createGithub } from "./github-wrapper";
import { send as sendMail } from "./mail-sender";
import { writeReport } from "./report-processor";
import { processTask } from "./task-processor";
import { ReportResult, Settings } from "./types";

interface IStatusOptions {
    readonly description: string;
    readonly owner: string;
    readonly reponame: string;
    readonly hash: string;
    readonly state: "pending" | "success" | "error";
}

interface IBuildOptions {
    readonly branch: string;
    readonly owner: string;
    readonly reponame: string;
    readonly rev: string;
    readonly skipGitLoader?: boolean;
    readonly url: string;
}

interface ISimpleCallback {
    (err?: any): void;
}

interface IBuildCallback {
    (err?: any, result?: ReportResult): void;
}

const codePostfix = "";
const mailLazinessLevel = 1000;
const maxDescriptionLength = 140;
const maxTmpcodepathLength = 15;
const twoDigits = 100;

const createFinalState = (isSuccess: boolean) => {
    if (isSuccess) {
        return "success";
    }

    return "error";
};

const createBuildDoneMessage = (isSuccess: boolean, name: string) => {
    if (isSuccess) {
        return `Successfully built ${name}`;
    }

    return `Build failed for ${name}`;
};

const notifyStatus = (settings: Settings, options: IStatusOptions, notifyStatusCallback: ISimpleCallback) => {
    const status = {
        description: String(options.description || "").substr(0, maxDescriptionLength),
        owner: options.owner,
        repo: options.reponame,
        sha: options.hash,
        state: options.state,
        target_url: `${settings.siteRoot}status/${options.owner}/${options.reponame}/${options.hash}`,
    };

    createGithub(settings, options.owner).repos.createStatus(status, (createStatusErr) => {
        if (createStatusErr) {
            console.log(`Error while creating status: ${createStatusErr}`);
            console.log(status);

            return notifyStatusCallback(createStatusErr);
        }

        return notifyStatusCallback();
    });
};

const wrapGitLoader: (skipGitLoader?: boolean) => typeof gitLoader = (skipGitLoader) => {
    if (!skipGitLoader) {
        return gitLoader;
    }

    return (_gitLoaderOptions, gitLoaderCallback) => process.nextTick(gitLoaderCallback);
};

export const build = (settings: Settings, options: IBuildOptions, buildCallback: IBuildCallback) => {
    const url = options.url;
    const owner = options.owner;
    const reponame = options.reponame;
    const rev = options.rev;
    const branch = options.branch;
    const skipGitLoader = options.skipGitLoader;
    const local = join(settings.gitpath, "r");
    const tmp = join(settings.tmpcodepath, rev.substr(0, maxTmpcodepathLength));
    const exported = tmp + codePostfix;
    const release = join(settings.releasepath, owner, reponame, branch, rev);
    const statusQueue = queue((task: (callback: any) => void, queueCallback) => task(queueCallback), 1);
    const actualGitLoader = wrapGitLoader(skipGitLoader);
    const date = new Date();
    const versionMajor = date.getFullYear();
    const versionMinor = date.getMonth() + 1;
    const versionBuild = date.getDate();
    const versionRev = (date.getHours() * twoDigits) + date.getMinutes();
    const version = `${versionMajor}.${versionMinor}.${versionBuild}.${versionRev}`;
    const versionInfo = `${version}; built from ${rev}; repository: ${owner}/${reponame}; branch: ${branch}`;

    statusQueue.push((queueCallback) => notifyStatus(settings, {
        description: "Preparing to build...",
        hash: rev,
        owner,
        reponame,
        state: "pending",
    }, queueCallback));

    mkdirsSync(release);

    writeFileSync(join(settings.releasepath, owner, reponame, branch, "latest.id"), rev);
    mkdirsSync(join(settings.releasepath, owner, reponame, "$revs"));
    writeFileSync(join(settings.releasepath, owner, reponame, "$revs", `${rev}.branch`), branch);

    const createErrorMessageForMail = (doneErr: any) => {
        if (!doneErr) {
            return "";
        }

        return `Error message: ${doneErr}\r\n\r\n`;
    };

    const createResultMessageForMail = (result?: ReportResult) => {
        if (!result || !result.messages || !result.messages.$allMessages) {
            return JSON.stringify(result, null, "    ");
        }

        return result.messages.$allMessages.map((msg) => `${msg.prefix}\t${msg.message}`).join("\r\n");
    };

    const done = (doneErr: any, result?: ReportResult) => {
        const allErrors = (result && result.errors && result.errors.$allMessages) || [];
        const allWarns = (result && result.warns && result.errors.$allMessages) || [];
        const allInfos = (result && result.infos && result.errors.$allMessages) || [];
        const errorMessage = (allErrors[0] && allErrors[0].message) || doneErr;
        const warnMessage = allWarns[0] && allWarns[0].message;
        const infoMessage = allInfos[allInfos.length - 1] && allInfos[allInfos.length - 1].message;

        writeReport(release, doneErr, result, (writeErr) => {
            statusQueue.push((queueCallback) => parallel([
                (parallelCallback) => notifyStatus(settings, {
                    description: errorMessage || warnMessage || infoMessage || "Success",
                    hash: rev,
                    owner,
                    reponame,
                    state: createFinalState(!doneErr),
                }, parallelCallback),
                (parallelCallback) => sendMail({
                    from: settings.smtp.sender,
                    headers: { "X-Laziness-level": mailLazinessLevel },
                    subject: createBuildDoneMessage(!doneErr, `${owner}/${reponame}/${branch}`),
                    text: `Build status URL: ${settings.siteRoot}status/${owner}/${reponame}/${rev}\r\n\r\n${createErrorMessageForMail(doneErr)}${createResultMessageForMail(result)}`,
                    to: settings.smtp.receiver,
                }, parallelCallback),
                (parallelCallback) => {
                    if (doneErr) {
                        return process.nextTick(parallelCallback);
                    }

                    return remove(tmp, parallelCallback);
                },
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
        hash: rev,
        local,
        remote: `${url}.git`,
    }, (gitLoaderErr) => {
        if (gitLoaderErr) {
            console.log(gitLoaderErr);

            return done(`Git fetch error: ${gitLoaderErr}`);
        }

        console.log("Done loading from git");

        return exists(join(exported, "mbs.json"), (exists) => {
            if (!exists) {
                return done("MBSNotFound");
            }

            return readFile(join(exported, "mbs.json"), "utf8", (readErr, data) => {
                if (readErr) {
                    return done(`MBSUnableToRead: ${readErr}`);
                }

                const { value, error } = JSONParse(data);

                if (error) {
                    console.log(`Malformed data: ${data}`);

                    return done("MBSMalformed");
                }

                return processTask(settings, value, {
                    branch,
                    exported,
                    owner,
                    release,
                    reponame,
                    rev,
                    versionInfo,
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
