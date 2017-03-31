"use strict";

import { GenericTask } from "../types";
import conditional from "./conditional";

interface IParameters {
    readonly major: string;
    readonly nuspecName: string;
    readonly version: string;
    readonly withoutCommitSha: boolean;
    readonly masterRepoOwner: string;
}

export default ((params, processor) => conditional({
    branch: "master",
    otherwise: {
        name: "nuget-pack",
        params: {
            major: params.major,
            name: params.nuspecName,
            nuspec: `${params.nuspecName}.nuspec`,
            version: params.version,
            withoutCommitSha: params.withoutCommitSha,
        },
        type: "dotnetnugetpack",
    },
    owner: params.masterRepoOwner,
    task: {
        name: "nuget-push",
        params: {
            major: params.major,
            name: params.nuspecName,
            nuspec: `${params.nuspecName}.nuspec`,
            version: params.version,
            withoutCommitSha: params.withoutCommitSha,
        },
        type: "dotnetnugetpush",
    },
}, processor)) as GenericTask<IParameters>;
