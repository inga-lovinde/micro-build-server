"use strict";

import { series } from "async";

import { Task, TaskProcessor } from "../types";

const mapper = (processor: TaskProcessor) => (task) => (callback) => processor.processTask(task, callback);

export default ((params, processor) => () => series(params.tasks.map(mapper(processor)), processor.done)) as Task;
