"use strict";

const async = require("async");

const mapper = (processor) => (task) => (callback) => processor.processTask(task, callback);

module.exports = (params, processor) => ({ "process": () => async.parallel(params.tasks.map(mapper(processor)), () => processor.done()) });
