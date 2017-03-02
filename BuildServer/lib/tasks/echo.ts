"use strict";

import { Task } from "../types";

export default ((params, processor) => () => {
    if (params.error) {
        processor.onError(params.error);
    }

    if (params.warn) {
        processor.onWarn(params.warn);
    }

    if (params.info) {
        processor.onInfo(params.info);
    }

    processor.done();
}) as Task;
