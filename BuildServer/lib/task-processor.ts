"use strict";

import tasks from "./tasks";
import { Messages, MessagesRoot, ProcessTaskContext, ReportResult, Settings, TaskInfo, TaskInfoExternal, TaskProcessor, TaskProcessorCallback, TaskProcessorCore } from "./types";

interface IFlags {
    [flagName: string]: boolean;
}

const isExternalTask = (task: TaskInfo): task is TaskInfoExternal => (task as TaskInfoExternal).type !== undefined;

// TaskProcessor does not look like EventEmitter, so no need to extend EventEmitter and use `emit' here.
const createTaskProcessor = (task: TaskInfo, outerProcessor: TaskProcessorCore, callback: TaskProcessorCallback) => {
    const errors: string[] = [];
    const getOuterPrefix = (prefix?: string) => {
        if (task.name && prefix) {
            return `${task.name}/${prefix}`;
        }

        return String(task.name || "") + String(prefix || "");
    };
    const onError = (message: string, prefix?: string) => {
        errors.push(message);
        outerProcessor.onError(message, getOuterPrefix(prefix));
    };
    const onWarn = (message: string, prefix?: string) => outerProcessor.onWarn(message, getOuterPrefix(prefix));
    const onInfo = (message: string, prefix?: string) => outerProcessor.onInfo(message, getOuterPrefix(prefix));

    let result: TaskProcessor;
    result = {
        context: outerProcessor.context,
        done: () => callback(errors.join("\r\n")),
        onError,
        onWarn,
        onInfo,
        process: () => (isExternalTask(task) ? tasks[task.type](task.params || {}, result) : task.task)(),
        processTask: (innerTask, innerCallback) => createTaskProcessor(innerTask, result, innerCallback).process(),
        settings: outerProcessor.settings,
    };

    return result;
};

const pushMessage = (list: Messages, message: string, parts: string[], index: number): void => {
    if (index < parts.length) {
        if (!list[parts[index]]) {
            list[parts[index]] = {};
        }

        return pushMessage(list[parts[index]] as Messages, message, parts, index + 1);
    }

    if (!list.$messages) {
        list.$messages = [];
    }

    list.$messages.push(message);
    return;
};

const pushMessageRoot = (list: MessagesRoot, message: string, parts: string[]): void => {
    list.$allMessages.push({
        message,
        prefix: parts.join("/"),
    });

    pushMessage((list as any) as Messages, message, parts, 0);
};

const addFlag = (flags: IFlags) => (flagName: string) => {
    flags[flagName] = true;
};

const containsFlag = (flags: IFlags) => (flagName: string) => flags[flagName];

export const processTask = (settings: Settings, task: TaskInfo, context: ProcessTaskContext, callback: (err: any, result: ReportResult) => void) => {
    const errors: MessagesRoot = { $allMessages: [] };
    const warns: MessagesRoot = { $allMessages: [] };
    const infos: MessagesRoot = { $allMessages: [] };
    const messages: MessagesRoot = { $allMessages: [] };
    const messageProcessor = (list: MessagesRoot) => (message: string, prefix: string) => {
        const parts = prefix.split("/");

        pushMessageRoot(list, message, parts);
        pushMessageRoot(messages, message, parts);
    };
    const flags: IFlags = {};
    const processor = createTaskProcessor(task, {
        context: {
            ...context,
            addFlag: addFlag(flags),
            containsFlag: containsFlag(flags),
        },
        onError: messageProcessor(errors),
        onInfo: messageProcessor(infos),
        onWarn: messageProcessor(warns),
        settings,
    }, (err) => callback(err, {
        errors,
        infos,
        messages,
        warns,
    }));

    processor.process();
};
