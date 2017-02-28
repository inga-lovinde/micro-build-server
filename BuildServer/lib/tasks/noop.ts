"use strict";

export default ((params, processor) => ({ process: () => processor.done() })) as Task;
