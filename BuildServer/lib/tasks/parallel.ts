"use strict";

import { parallel } from "async";

import { Task, TaskProcessor } from "../types";

const mapper = (processor: TaskProcessor) => (task) => (callback) => processor.processTask(task, callback);

export default ((params, processor) => () => parallel(params.tasks.map(mapper(processor)), processor.done)) as Task;
