"use strict";

import * as _ from "underscore";

import { MessagesRoot, TaskInfo, TaskProcessor, TaskProcessorCallback, TaskProcessorCore } from "../types";
import tasks from "./tasks";

// TaskProcessor does not look like EventEmitter, so no need to extend EventEmitter and use `emit' here.
const createTaskProcessor = (task: TaskInfo, outerProcessor: TaskProcessorCore, callback: TaskProcessorCallback) => {
    const errors: string[] = [];
    const getOuterPrefix = (prefix) => {
        if (task.name && prefix) {
            return `${task.name}/${prefix}`;
        }

        return String(task.name || "") + String(prefix || "");
    };
    const onError = (message, prefix) => {
        errors.push(message);
        outerProcessor.onError(message, getOuterPrefix(prefix));
    };
    const onWarn = (message, prefix) => outerProcessor.onWarn(message, getOuterPrefix(prefix));
    const onInfo = (message, prefix) => outerProcessor.onInfo(message, getOuterPrefix(prefix));

    let result: TaskProcessor;
    result = {
        context: outerProcessor.context,
        done: () => callback(errors.join("\r\n")),
        onError,
        onWarn,
        onInfo,
        process: () => tasks[task.type](task.params || {}, result)(),
        processTask: (innerTask, innerCallback) => createTaskProcessor(innerTask, result, innerCallback).process(),
    };

    return result;
};

const pushMessage = (list, message, parts, index) => {
    if (!index) {
        list.$allMessages.push({
            message,
            prefix: parts.join("/"),
        });
    }

    if (index < parts.length) {
        if (!list[parts[index]]) {
            list[parts[index]] = {};
        }

        return pushMessage(list[parts[index]], message, parts, index + 1);
    }

    if (!list.$messages) {
        list.$messages = [];
    }

    return list.$messages.push(message);
};

const addFlag = (flags) => (flagName) => {
    flags[flagName] = true;
};

const containsFlag = (flags) => (flagName) => flags[flagName];

export const processTask = (task, context, callback) => {
    const errors: MessagesRoot = { $allMessages: [] };
    const warns: MessagesRoot = { $allMessages: [] };
    const infos: MessagesRoot = { $allMessages: [] };
    const messages: MessagesRoot = { $allMessages: [] };
    const messageProcessor = (list) => (message, prefix) => {
        const parts = prefix.split("/");

        pushMessage(list, message, parts, 0);
        pushMessage(messages, message, parts, 0);
    };
    const flags = {};
    const processor = createTaskProcessor(task, {
        context: {
            ...context,
            addFlag: addFlag(flags),
            containsFlag: containsFlag(flags),
        },
        onError: messageProcessor(errors),
        onInfo: messageProcessor(infos),
        onWarn: messageProcessor(warns),
    }, (err) => callback(err, {
        errors,
        infos,
        messages,
        warns,
    }));

    processor.process();
};
