"use strict";

import * as RawGithub from "github";

import { Settings } from "./types";

interface IHttpError extends Error {
    readonly message: string;
    readonly code: number;
    readonly status: any;
    readonly headers: any;
}

type ICallback<T> = (error: IHttpError, result?: { data: T }) => void;

interface IIssueData {
    readonly id: number;
    readonly number: number;
    readonly state: "open" | "closed";
    readonly title: string;
    readonly pull_request?: {
        readonly url: string;
    };
}

interface IReleaseData {
    readonly id: number;
}

interface IStatusData {
    readonly id: number;
}

interface IGithub {
    readonly issues: {
        createComment(params: RawGithub.IssuesCreateCommentParams, callback: ICallback<never>): void;
        edit(params: RawGithub.IssuesEditParams, callback: ICallback<never>): void;
        get(params: RawGithub.IssuesGetParams, callback: ICallback<IIssueData>): void;
    };
    readonly repos: {
        createStatus(params: RawGithub.ReposCreateStatusParams, callback: ICallback<IStatusData>): void;
        getReleases(params: RawGithub.ReposGetReleasesParams, callback: ICallback<IReleaseData[]>): void;
    };
}

const createGithub = (settings: Settings, repoOwner: string) => settings.createGithub(repoOwner) as IGithub;

export {
    IGithub,
    createGithub,
};
