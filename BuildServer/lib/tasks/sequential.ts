"use strict";

import { series } from "async";

import { Task } from "../../types";

const mapper = (processor) => (task) => (callback) => processor.processTask(task, callback);

export default ((params, processor) => () => series(params.tasks.map(mapper(processor)), processor.done)) as Task;
