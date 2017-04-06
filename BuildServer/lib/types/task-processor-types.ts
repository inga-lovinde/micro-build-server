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
    readonly processTask: (task: TaskInfo, innerCallback: TaskProcessorCallback) => void;
    readonly done: () => void;
}

interface ITaskParameters {
    readonly [paramName: string]: any;
}

type TaskWithParameters = () => void;

export type GenericTask<TParams> = (params: TParams, processor: ITaskProcessor) => TaskWithParameters;

export type Task = GenericTask<ITaskParameters>;

export interface ITasks {
    readonly [taskName: string]: Task;
}

export interface ITaskInfoExternal {
    readonly name?: string;
    readonly type: string;
    readonly params?: ITaskParameters;
}

export interface ITaskInfoInternal {
    readonly name: string;
    readonly task: TaskWithParameters;
}

export type TaskInfo = ITaskInfoExternal | ITaskInfoInternal;
