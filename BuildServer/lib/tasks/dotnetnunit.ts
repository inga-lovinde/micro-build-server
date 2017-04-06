"use strict";

import { join } from "path";

import { GenericTask } from "../types";
import dotNetBuilderWrapper from "./dotnetbuilderwrapper";

export default ((params) => (processor) => dotNetBuilderWrapper({
    TestLibraryPath: join(processor.context.exported, params.assembly),
    command: "nunit",
})(processor)) as GenericTask<{ readonly assembly: string }>;
