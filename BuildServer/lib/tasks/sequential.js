"use strict";

const async = require("async");

const mapper = (processor) => (task) => (callback) => processor.processTask(task, callback);

module.exports = (params, processor) => ({ "process": () => async.series(params.tasks.map(mapper(processor)), () => processor.done()) });
