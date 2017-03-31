"use strict";

import { join } from "path";

import { GenericTask } from "../types";
import dotnetbuilderwrapper from "./dotnetbuilderwrapper";

export default ((params, processor) => dotnetbuilderwrapper({
    BaseDirectory: processor.context.exported,
    SolutionPath: join(processor.context.exported, params.solution),
    command: "nugetrestore",
}, processor)) as GenericTask<{ readonly solution: string }>;
