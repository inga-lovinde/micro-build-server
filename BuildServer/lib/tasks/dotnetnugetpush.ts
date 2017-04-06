"use strict";

import { GenericTask } from "../types";
import dotnetnugetprocessinternal from "./dotnetnugetprocessinternal";
import dotnetnugetpushonly from "./dotnetnugetpushonly";

interface IDotNetNuGetPushParameters {
    readonly withoutCommitSha?: boolean;
    readonly major?: string;
    readonly version?: string;
    readonly name: string;
    readonly nuspec: string;
}

export default ((params) => (processor) => dotnetnugetprocessinternal({
    ...params,
    getFinalTask: (nupkg) => ({
        name: "pushonly",
        task: dotnetnugetpushonly({ Package: nupkg }),
    }),
})(processor)) as GenericTask<IDotNetNuGetPushParameters>;
