export interface ICompileRequest {
    readonly command: "compile";
    readonly SolutionPath: string;
    readonly Target: string;
    readonly Configuration: string;
    readonly OutputDirectory: string;
    readonly SigningKey?: string;
    readonly SkipCodeAnalysis: boolean;
}

export interface INugetPackRequest {
    readonly command: "nugetpack";
    readonly BaseDirectory: string;
    readonly SpecPath: string;
    readonly OutputDirectory: string;
    readonly Version: string;
}

export interface INugetPushRequest {
    readonly command: "nugetpush";
    readonly Package: string;
    readonly NugetHost: string;
    readonly ApiKey: string;
}

export interface INugetRestoreRequest {
    readonly command: "nugetrestore";
    readonly BaseDirectory: string;
    readonly SolutionPath: string;
}

export interface INunitRequest {
    readonly command: "nunit";
    readonly TestLibraryPath: string;
}

export type Request = ICompileRequest | INugetPackRequest | INugetPushRequest | INugetRestoreRequest | INunitRequest;
