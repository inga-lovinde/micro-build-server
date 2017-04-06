"use strict";

import { GenericTask } from "../types";

interface IParameters {
    readonly error: string;
    readonly warn: string;
    readonly info: string;
}

export default ((params) => (processor) => () => {
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
}) as GenericTask<IParameters>;
