"use strict";

import { GenericTask, TaskInfo } from "../types";

interface IParameters {
    readonly owner?: string;
    readonly branch?: string;
    readonly task: TaskInfo;
    readonly otherwise?: TaskInfo;
}

export default ((params, processor) => {
    const condition = (!params.owner || params.owner === processor.context.owner)
        && (!params.branch || params.branch === processor.context.branch || `refs/heads/${params.branch}` === processor.context.branch);
    const task = (condition && params.task) || params.otherwise;

    return () => processor.processTask(task || { type: "noop", params: {} }, processor.done);
}) as GenericTask<IParameters>;
