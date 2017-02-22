"use strict";

import async = require("async");

const mapper = (processor) => (task) => (callback) => processor.processTask(task, callback);

export = (params, processor) => ({ "process": () => async.parallel(params.tasks.map(mapper(processor)), () => processor.done()) });
