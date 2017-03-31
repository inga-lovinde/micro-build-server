"use strict";

import * as _ from "underscore";

import { createGithub, IGithub } from "./github-wrapper";
import { getStatusMessageFromRelease } from "./report-processor";
import { Settings } from "./types";

interface IRepoOptions {
    readonly branch: string;
    readonly branchName: string;
    readonly owner: string;
    readonly reponame: string;
}

interface IRepoCommitOptions extends IRepoOptions {
    readonly rev: string;
}

interface IPullRequestOptions {
    readonly action: string;
    readonly baseRepoOptions: IRepoOptions;
    readonly headRepoOptions: IRepoCommitOptions;
    readonly pullRequestNumber: number;
}

interface IPullRequestOptionsWithGithub extends IPullRequestOptions {
    readonly github: IGithub;
}

interface ISimpleCallback {
    (err?: any): void;
}

interface IHasIssueCallback {
    (err?: any, hasIssue?: boolean, issueTitle?: string): void;
}

interface IHasReleasesCallback {
    (err?: any, hasReleases?: boolean): void;
}

const featureNamePattern = /^feature-(\d+)(?:-[a-zA-Z0-9]+)+$/;
const versionNamePattern = /^v\d+(\.\d+)*$/;
const masterNamePattern = /^master$/;

const httpNotFound = 404;
const maxCommentLength = 64000;

const writeComment = (options: IPullRequestOptionsWithGithub, message: string, callback: ISimpleCallback) => options.github.issues.createComment({
    body: message,
    number: options.pullRequestNumber,
    owner: options.baseRepoOptions.owner,
    repo: options.baseRepoOptions.reponame,
}, callback);

const closePullRequest = (options: IPullRequestOptionsWithGithub, message: string, callback: ISimpleCallback) => writeComment(options, message, (err: any) => {
    if (err) {
        return callback(err);
    }

    return options.github.issues.edit({
        number: options.pullRequestNumber,
        owner: options.baseRepoOptions.owner,
        repo: options.baseRepoOptions.reponame,
        state: "closed",
    }, callback);
});

const checkHasIssue = (options: IPullRequestOptionsWithGithub, issueNumber: number, callback: IHasIssueCallback) => options.github.issues.get({
    number: issueNumber,
    owner: options.baseRepoOptions.owner,
    repo: options.baseRepoOptions.reponame,
}, (getIssueErr, result) => {
    if (getIssueErr) {
        if (getIssueErr.code && getIssueErr.code !== httpNotFound) {
            return callback(getIssueErr.message);
        }

        return callback(null, false);
    }

    if (!result) {
        return callback("Result is empty");
    }

    if (result.data.number.toString() !== issueNumber.toString()) {
        return callback(null, false);
    }

    if (result.data.pull_request && result.data.pull_request.url) {
        return callback(null, false);
    }

    return callback(null, true, result.data.title);
});

const checkHasReleases = (options: IPullRequestOptionsWithGithub, callback: IHasReleasesCallback) => options.github.repos.getReleases({
    owner: options.baseRepoOptions.owner,
    per_page: 1,
    repo: options.baseRepoOptions.reponame,
}, (getReleasesErr, result) => {
    if (getReleasesErr) {
        return callback(getReleasesErr);
    }

    return callback(null, Boolean(result && result.data && result.data.length));
});

const checkPullRequest = (options: IPullRequestOptionsWithGithub, callback: ISimpleCallback) => {
    const head = options.headRepoOptions;
    const base = options.baseRepoOptions;

    if (head.reponame !== base.reponame) {
        return closePullRequest(options, "Base and head repository names should match", callback);
    }

    if (head.owner === base.owner) {
        if (!versionNamePattern.test(head.branchName) || !masterNamePattern.test(base.branchName)) {
            return closePullRequest(options, "Only merging from version to master is allowed", callback);
        }

        return checkHasReleases(options, (hasReleasesErr, hasReleases?: boolean) => {
            if (hasReleasesErr) {
                return writeComment(options, "Unable to check for releases", callback);
            }

            if (!hasReleases) {
                return closePullRequest(options, "Merging from version to master is only allowed for repositories with releases", callback);
            }

            if (options.action === "opened") {
                return writeComment(options, `Switching master branch to ${head.branchName} release`, callback);
            }

            return process.nextTick(callback);
        });
    }

    if (!featureNamePattern.test(head.branchName)) {
        return closePullRequest(options, `Only merging from feature branch is allowed (pattern: \`${featureNamePattern}\`)`, callback);
    }

    if (!versionNamePattern.test(base.branchName) && !masterNamePattern.test(base.branchName)) {
        return closePullRequest(options, `Only merging to master or version branch is allowed; merging to '${base.branchName}'  is not supported`, callback);
    }

    const execResult = featureNamePattern.exec(head.branchName);
    const issueNumber = (execResult && parseInt(execResult[1], 10)) || 0; // execResult will never be empty

    return checkHasIssue(options, issueNumber, (hasIssueErr, hasIssue?: boolean, issueTitle?: string) => {
        if (hasIssueErr) {
            return writeComment(options, `Unable to check for issue:\r\n\r\n${hasIssueErr}`, callback);
        }

        if (!hasIssue) {
            return closePullRequest(options, `Unable to find issue #${issueNumber}`, callback);
        }

        const shouldHaveReleases = versionNamePattern.test(base.branchName);

        return checkHasReleases(options, (hasReleasesErr, hasReleases) => {
            if (hasReleasesErr) {
                return writeComment(options, "Unable to check for releases", callback);
            }

            if (shouldHaveReleases && !hasReleases) {
                return closePullRequest(options, "Merging from feature to version is only allowed for repositories with releases", callback);
            }

            if (!shouldHaveReleases && hasReleases) {
                return closePullRequest(options, "Merging from feature to master is only allowed for repositories without releases", callback);
            }

            if (options.action === "opened") {
                return writeComment(options, `Merging feature #${issueNumber} (${issueTitle}) to ${base.branchName}`, callback);
            }

            return process.nextTick(callback);
        });
    });
};

export const commentOnPullRequest = (settings: Settings, originalOptions: IPullRequestOptions, callback: ISimpleCallback) => {
    const options = {
        ...originalOptions,
        github: createGithub(settings, originalOptions.baseRepoOptions.owner),
    };
    const getStatusMessageOptions = {
        ...options.headRepoOptions,
        onTenthAttempt: () => writeComment(options, "Waiting for build to finish...", _.noop),
    };

    return checkPullRequest(options, () => getStatusMessageFromRelease(settings, getStatusMessageOptions, (statusMessageErr, statusSuccessMessage) => {
        const escapedErr = String(statusMessageErr || "").substring(0, maxCommentLength)
            .replace(/`/g, "` ");
        const message = statusMessageErr
            ? `Was not built:\r\n\r\n\`\`\`\r\n${escapedErr}\r\n\`\`\`\r\n\r\nDO NOT MERGE!`
            : `Build OK\r\n\r\n${statusSuccessMessage}`;
        const statusUrlMessage = `Build status URL: ${settings.siteRoot}status/${options.headRepoOptions.owner}/${options.headRepoOptions.reponame}/${options.headRepoOptions.rev}\r\n\r\n`;

        return writeComment(options, `${message}\r\n\r\n${statusUrlMessage}`, callback);
    }));
};
