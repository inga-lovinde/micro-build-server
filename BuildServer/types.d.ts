interface Message {
    readonly message: string;
    readonly prefix: string;
}

interface PartialMessagesLeaf {
    readonly $messages?: string[];
}

interface PartialMessagesRecursive {
    readonly [propName: string]: Messages | string[] | Message[]; // workaround for compatibility with PartialMessagesLeaf and PartialMessagesRoot
}

interface PartialMessagesRoot {
    readonly $allMessages: Message[];
}

type Messages = PartialMessagesLeaf & PartialMessagesRecursive;

type MessagesRoot = PartialMessagesLeaf & PartialMessagesRecursive & PartialMessagesRoot;

interface ReportResult {
    readonly errors: MessagesRoot;
    readonly warns: MessagesRoot;
    readonly infos: MessagesRoot;
    readonly messages: MessagesRoot;
}

interface Report {
    readonly date: number;
    readonly err?: string;
    readonly result?: ReportResult;
}

interface TaskProcessorCallback {
    (err: string): void;
}

interface TaskProcessorCore {
    readonly onError: (message: string | Error, prefix?: string) => void;
    readonly onWarn: (message: string, prefix?: string) => void;
    readonly onInfo: (message: string, prefix?: string) => void;
    readonly context?: any;
}

interface TaskProcessor extends TaskProcessorCore {
    readonly process: () => void;
    readonly processTask: (task: TaskInfo, innerCallback: TaskProcessorCallback) => void;
    readonly done: () => void;
}

interface TaskInfo {
    name?: string;
    type: string;
    params: any;
}

interface Task {
    (params: any, processor: TaskProcessor): () => void;
}

interface Tasks {
    readonly [taskName: string]: Task;
}

export {
    Message,
    MessagesRoot,
    Report,
    ReportResult,
    Task,
    TaskInfo,
    TaskProcessor,
    TaskProcessorCore,
    TaskProcessorCallback,
    Tasks,
}
