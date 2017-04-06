"use strict";

import { GenericTask } from "../types";
import conditional from "./conditional";
import dotnetnugetpack from "./dotnetnugetpack";
import dotnetnugetpush from "./dotnetnugetpush";

interface IDotNetNuGetPushParameters {
    readonly major: string;
    readonly nuspecName: string;
    readonly version: string;
    readonly withoutCommitSha: boolean;
    readonly masterRepoOwner: string;
}

export default ((params) => (processor) => conditional({
    branch: "master",
    otherwise: {
        name: "nuget-pack",
        task: dotnetnugetpack({
            major: params.major,
            name: params.nuspecName,
            nuspec: `${params.nuspecName}.nuspec`,
            version: params.version,
            withoutCommitSha: params.withoutCommitSha,
        }),
    },
    owner: params.masterRepoOwner,
    task: {
        name: "nuget-push",
        task: dotnetnugetpush({
            major: params.major,
            name: params.nuspecName,
            nuspec: `${params.nuspecName}.nuspec`,
            version: params.version,
            withoutCommitSha: params.withoutCommitSha,
        }),
    },
})(processor)) as GenericTask<IDotNetNuGetPushParameters>;
