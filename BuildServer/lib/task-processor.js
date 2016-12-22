"use strict";

//TaskProcessor does not look like EventEmitter, so no need to extend EventEmitter and use `emit' here.
const TaskProcessor = function (task, outerProcessor, callback) {
     if (!this) {
        return new TaskProcessor(task);
    }

    const self = this;
    let taskWorker = undefined;
    const errors = [];
    const process = () => taskWorker.process();
    const getOuterPrefix = (prefix) => (task.name && prefix) ? (task.name + "/" + prefix) : (task.name || "") + (prefix || "");
    const onError = (message, prefix) => {
        errors.push(message);
        outerProcessor.onError(message, getOuterPrefix(prefix));
    };
    const onWarn = (message, prefix) => outerProcessor.onWarn(message, getOuterPrefix(prefix));
    const onInfo = (message, prefix) => outerProcessor.onInfo(message, getOuterPrefix(prefix));
    const processTask = (innerTask, innerCallback) => {
        const innerProcessor = new TaskProcessor(innerTask, self, innerCallback);
        innerProcessor.process();
    };
    const done = () => callback(errors.join("\r\n"));

    self.process = process;
    self.onError = onError;
    self.onWarn = onWarn;
    self.onInfo = onInfo;
    self.processTask = processTask;
    self.done = done;
    self.context = outerProcessor.context;

    const taskImpl = require('./tasks/' + task.type.match(/[\w\-]/g).join(""));
    taskWorker = taskImpl(task.params || {}, self);
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
                innerList = (innerList[part] = innerList[part] || {});
            });

            innerList.$messages = innerList.$messages || [];
            innerList.$messages.push(message);

            list.$allMessages = list.$allMessages || [];
            list.$allMessages.push({ prefix: prefix, message: message });
        };

        return (message, prefix) => {
            f(list, message, prefix);
            f(messages, message, prefix);
        };
    };
    const processor = new TaskProcessor(task, {
        onError: messageProcessor(errors),
        onWarn: messageProcessor(warns),
        onInfo: messageProcessor(infos),
        context: context
    }, (err) => callback(err, {
        errors: errors,
        warns: warns,
        infos: infos,
        messages: messages
    }));

    processor.process();
};
