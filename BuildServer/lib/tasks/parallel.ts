"use strict";

import { parallel } from "async";

const mapper = (processor) => (task) => (callback) => processor.processTask(task, callback);

export default (params, processor) => ({ "process": () => parallel(params.tasks.map(mapper(processor)), () => processor.done()) });
