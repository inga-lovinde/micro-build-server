"use strict";

import * as RawGithub from "github";
import settings from "../settings";

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
        get(params: RawGithub.IssuesGetParams, callback: ICallback<IIssueData>): void;
    };
    readonly repos: {
        createStatus(params: RawGithub.ReposCreateStatusParams, callback: ICallback<IStatusData>);
        getReleases(params: RawGithub.ReposGetReleasesParams, callback: ICallback<IReleaseData[]>);
    };
}

const createGithub = (repoOwner) => settings.createGithub(repoOwner) as any as IGithub;

export {
    IGithub,
    createGithub,
};
