"use strict";

//TaskProcessor does not look like EventEmitter, so no need to extend EventEmitter and use `emit' here.
var TaskProcessor = function (task, outerProcessor, callback) {
 	if (!this) {
		return new TaskProcessor(task);
	}

	var self = this,
		taskImpl,
		taskWorker,
		errors = [],
		process = function () {
			taskWorker.process();
		},
		getOuterPrefix = function (prefix) {
			return (task.name && prefix) ? (task.name + "/" + prefix) : (task.name || "") + (prefix || "");
		},
		onError = function (message, prefix) {
			errors.push(message);
			outerProcessor.onError(message, getOuterPrefix(prefix));
		},
		onWarn = function (message, prefix) {
			outerProcessor.onWarn(message, getOuterPrefix(prefix));
		},
		onInfo = function (message, prefix) {
			outerProcessor.onInfo(message, getOuterPrefix(prefix));
		},
		processTask = function (innerTask, innerCallback) {
			var innerProcessor = new TaskProcessor(innerTask, self, innerCallback);
			innerProcessor.process();
		},
		done = function () {
			callback(errors.join("\r\n"));
		};

	self.process = process;
	self.onError = onError;
	self.onWarn = onWarn;
	self.onInfo = onInfo;
	self.processTask = processTask;
	self.done = done;
	self.context = outerProcessor.context;

	taskImpl = require('./tasks/' + task.type.match(/[\w\-]/g).join(""));
	taskWorker = taskImpl(task.params, self);
};

exports.processTask = function (task, context, callback) {
	var errors = {},
		warns = {},
		infos = {},
		messageProcessor = function (list) {
			return function (message, prefix) {
				var i,
					parts = prefix.split("/"),
					innerList = list;

				for (i = 0; i < parts.length; i += 1) {
					innerList = (innerList[parts[i]] = innerList[parts[i]] || {});
				}

				innerList.$messages = innerList.$messages || [];
				innerList.$messages.push(message);

				list.$allMessages = list.$allMessages || [];
				list.$allMessages.push({ prefix: prefix, message: message });
			};
		},
		processor = new TaskProcessor(task, {
			onError: messageProcessor(errors),
			onWarn: messageProcessor(warns),
			onInfo: messageProcessor(infos),
			context: context
		}, function (err) {
			callback(err, {
				errors: errors,
				warns: warns,
				infos: infos
			});
		});

	processor.process();
};
