import { Settings } from "./settings-types";

export interface IProcessTaskContext {
    readonly exported: string;
    readonly release: string;
    readonly owner: string;
    readonly reponame: string;
    readonly branch: string;
    readonly rev: string;
    readonly versionInfo: string;
}

interface ITaskProcessorContext extends IProcessTaskContext {
    readonly addFlag: (flagName: string) => void;
    readonly containsFlag: (flagName: string) => boolean;
}

export type TaskProcessorCallback = (err: string) => void;

export interface ITaskProcessorCore {
    readonly onError: (message: string | Error, prefix?: string) => void;
    readonly onWarn: (message: string, prefix?: string) => void;
    readonly onInfo: (message: string, prefix?: string) => void;
    readonly settings: Settings;
    readonly context: ITaskProcessorContext;
}

export interface ITaskProcessor extends ITaskProcessorCore {
    readonly process: () => void;
    readonly processTask: (task: ITaskInfo, innerCallback: TaskProcessorCallback) => void;
    readonly done: () => void;
}

export interface ITaskInfo {
    readonly name?: string;
    readonly type: string;
    readonly params: any;
}

export type Task = (params: any, processor: ITaskProcessor) => () => void;

export interface ITasks {
    readonly [taskName: string]: Task;
}
