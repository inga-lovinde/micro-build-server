export interface IMessage {
    readonly message: string;
    readonly prefix: string;
}

type IPartialMessageLeafContent = string[];
type IPartialMessageRootContent = IMessage[];

interface IPartialMessagesLeaf {
    readonly $messages?: string[];
}

// workaround for compatibility with PartialMessagesLeaf and PartialMessagesRoot
interface IPartialMessagesRecursive {
    readonly [propName: string]: Messages | IPartialMessageLeafContent;
}

interface IPartialMessagesRecursiveRoot {
    readonly [propName: string]: Messages | IPartialMessageRootContent | IPartialMessageLeafContent;
}

interface IPartialMessagesRoot {
    readonly $allMessages: IPartialMessageRootContent;
}

export type Messages = IPartialMessagesRecursive & IPartialMessagesLeaf;

export type MessagesRoot = IPartialMessagesRecursiveRoot & IPartialMessagesRoot & IPartialMessagesLeaf;

export interface IReportResult {
    readonly errors: MessagesRoot;
    readonly warns: MessagesRoot;
    readonly infos: MessagesRoot;
    readonly messages: MessagesRoot;
}

export interface IReport {
    readonly date: number;
    readonly err?: string;
    readonly result?: IReportResult;
}
