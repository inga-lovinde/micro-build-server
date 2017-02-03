"use strict";

const tasks = require("./tasks");

// TaskProcessor does not look like EventEmitter, so no need to extend EventEmitter and use `emit' here.
const TaskProcessor = function (task, outerProcessor, callback) {
    if (!this) {
        return new TaskProcessor(task);
    }

    const that = this;
    let taskWorker = null;
    const errors = [];
    const process = () => taskWorker.process();
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

    const taskImpl = tasks[task.type];

    taskWorker = taskImpl(task.params || {}, that);

    return this;
};

exports.processTask = (task, context, callback) => {
    const errors = {};
    const warns = {};
    const infos = {};
    const messages = {};
    const messageProcessor = (list) => {
        const f = (list, message, prefix) => {
            const parts = prefix.split("/");
            let innerList = list;

            parts.forEach((part) => {
                innerList = innerList[part] = innerList[part] || {};
            });

            innerList.$messages = innerList.$messages || [];
            innerList.$messages.push(message);

            list.$allMessages = list.$allMessages || [];
            list.$allMessages.push({
                message,
                prefix
            });
        };

        return (message, prefix) => {
            f(list, message, prefix);
            f(messages, message, prefix);
        };
    };
    const processor = new TaskProcessor(task, {
        context,
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
