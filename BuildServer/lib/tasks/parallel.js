"use strict";

const async = require("async");

module.exports = (params, processor) => ({
    process: () => async.parallel(params.tasks.map((task) => (callback) => processor.processTask(task, (err) => callback())), processor.done.bind(processor))
});
