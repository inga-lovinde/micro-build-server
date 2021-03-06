"use strict";

import { series } from "async";

import { GenericTask, TaskInfo, TaskProcessor, TaskProcessorCallback } from "../types";

interface IParameters {
    tasks: TaskInfo[];
};

const mapper = (processor: TaskProcessor) => (task: TaskInfo) => (callback: TaskProcessorCallback) => processor.processTask(task, callback);

export default ((params) => (processor) => () => series(params.tasks.map(mapper(processor)), processor.done)) as GenericTask<IParameters>;
