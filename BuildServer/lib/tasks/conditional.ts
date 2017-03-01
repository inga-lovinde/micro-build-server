"use strict";

import { Task } from "../../types";

export default ((params, processor) => {
    const condition = (!params.owner || params.owner === processor.context.owner)
        && (!params.branch || params.branch === processor.context.branch || `refs/heads/${params.branch}` === processor.context.branch);
    const task = (condition && params.task) || params.otherwise;

    return () => processor.processTask(task || { type: "noop" }, processor.done);
}) as Task;
