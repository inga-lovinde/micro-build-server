"use strict";

import { GenericTask } from "../types";
import dotnetnugetprocessinternal from "./dotnetnugetprocessinternal";

interface IParameters {
    readonly name: string;
    readonly nuspec: string;
}

export default ((params, processor) => dotnetnugetprocessinternal({
    ...params,
    getFinalTask: (nupkg) => ({
        params: { filename: nupkg },
        type: "copy",
    }),
}, processor)) as GenericTask<IParameters>;
