"use strict";

import { parallel } from "async";

import { Task } from "../../types";

const mapper = (processor) => (task) => (callback) => processor.processTask(task, callback);

export default ((params, processor) => () => parallel(params.tasks.map(mapper(processor)), processor.done)) as Task;
