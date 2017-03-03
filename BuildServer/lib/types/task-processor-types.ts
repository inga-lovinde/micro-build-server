import { Settings } from "./settings-types";

export type TaskProcessorCallback = (err: string) => void;

export interface ITaskProcessorCore {
    readonly onError: (message: string | Error, prefix?: string) => void;
    readonly onWarn: (message: string, prefix?: string) => void;
    readonly onInfo: (message: string, prefix?: string) => void;
    readonly settings: Settings;
    readonly context?: any;
}

export interface ITaskProcessor extends ITaskProcessorCore {
    readonly process: () => void;
    readonly processTask: (task: ITaskInfo, innerCallback: TaskProcessorCallback) => void;
    readonly done: () => void;
}

export interface ITaskInfo {
    name?: string;
    type: string;
    params: any;
}

export type Task = (params: any, processor: ITaskProcessor) => () => void;

export interface ITasks {
    readonly [taskName: string]: Task;
}
