interface IOwnerInfo {
    readonly name: string;
    readonly login: string;
}

interface IRepositoryInfo {
    readonly owner: IOwnerInfo;
    readonly name: string;
    readonly url: string;
}

interface ITargetInfo {
    readonly repo: IRepositoryInfo;
    readonly ref: string;
    readonly sha: string;
}

interface IPullRequestInfo {
    readonly head: ITargetInfo;
    readonly base: ITargetInfo;
    readonly merged: boolean;
}

export interface IHookPushPayload {
    readonly repository: IRepositoryInfo;
    readonly ref: string;
    readonly after: string;
}

export interface IHookPullRequestPayload {
    readonly action: "opened" | "reopened" | "closed" | "synchronize" | "other-unsupported-actions";
    readonly number: number;
    readonly pull_request: IPullRequestInfo;
}

interface IHookPushParameters {
    readonly eventType: "push";
    readonly payload: IHookPushPayload;
}

interface IHookPullRequestParameters {
    readonly eventType: "pull_request";
    readonly payload: IHookPullRequestPayload;
}

interface IHookUnsupportedRequestParameters {
    readonly eventType: "other-unsupported-events";
}

export type HookParameters = IHookPushParameters | IHookPullRequestParameters | IHookUnsupportedRequestParameters;
