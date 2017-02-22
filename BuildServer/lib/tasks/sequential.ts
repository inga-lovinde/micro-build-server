"use strict";

import { series } from "async";

const mapper = (processor) => (task) => (callback) => processor.processTask(task, callback);

export default (params, processor) => ({ "process": () => series(params.tasks.map(mapper(processor)), () => processor.done()) });
