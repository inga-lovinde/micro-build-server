"use strict";

import { GenericTask } from "../types";
import copy from "./copy";
import dotnetnugetprocessinternal from "./dotnetnugetprocessinternal";

interface IDotNetNuGetPackParameters {
    readonly withoutCommitSha?: boolean;
    readonly major?: string;
    readonly version?: string;
    readonly name: string;
    readonly nuspec: string;
}

export default ((params) => (processor) => dotnetnugetprocessinternal({
    ...params,
    getFinalTask: (nupkg) => ({
        name: "copynupkg",
        task: copy({ filename: nupkg }),
    }),
})(processor)) as GenericTask<IDotNetNuGetPackParameters>;
