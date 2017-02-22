"use strict";

import _ = require("underscore");
import tasks from "./tasks";

// TaskProcessor does not look like EventEmitter, so no need to extend EventEmitter and use `emit' here.
const TaskProcessor = function (task, outerProcessor, callback) {
    const that = this;
    const createTaskWorker = () => tasks[task.type](task.params || {}, that);
    const errors = [];
    const process = () => createTaskWorker().process();
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
    const processTask = (innerTask, innerCallback) => {
        const innerProcessor = new TaskProcessor(innerTask, that, innerCallback);

        innerProcessor.process();
    };
    const done = () => callback(errors.join("\r\n"));

    that.process = process;
    that.onError = onError;
    that.onWarn = onWarn;
    that.onInfo = onInfo;
    that.processTask = processTask;
    that.done = done;
    that.context = outerProcessor.context;
};

const pushMessage = (list, message, parts, index) => {
    if (!index) {
        list.$allMessages = list.$allMessages || []; // eslint-disable-line fp/no-mutation
        list.$allMessages.push({ // eslint-disable-line fp/no-mutating-methods
            message,
            "prefix": parts.join("/")
        });
    }

    list.$messages = list.$messages || []; // eslint-disable-line fp/no-mutation
    if (index === parts.length) {
        return list.$messages.push(message); // eslint-disable-line fp/no-mutating-methods
    }

    return pushMessage(list, message, parts, index + 1);
};

const addFlag = (flags) => (flagName) => {
    flags[flagName] = true; // eslint-disable-line fp/no-mutation
};

const containsFlag = (flags) => (flagName) => flags[flagName];

export const processTask = (task, context, callback) => {
    const errors = {};
    const warns = {};
    const infos = {};
    const messages = {};
    const messageProcessor = (list) => (message, prefix) => {
        const parts = prefix.split("/");

        pushMessage(list, message, parts, 0);
        pushMessage(messages, message, parts, 0);
    };
    const flags = {};
    const processor = new TaskProcessor(task, {
        "context": _.extend(context, {
            "addFlag": addFlag(flags),
            "containsFlag": containsFlag(flags)
        }),
        "onError": messageProcessor(errors),
        "onInfo": messageProcessor(infos),
        "onWarn": messageProcessor(warns)
    }, (err) => callback(err, {
        errors,
        infos,
        messages,
        warns
    }));

    processor.process();
};
