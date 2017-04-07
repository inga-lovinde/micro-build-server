import * as Github from "github";

interface IBuilderSettings {
    readonly builderExecutable: string;
}

interface ICodeAnalysisSettingsUnsupported {
    readonly isCodeAnalysisUnsupported: true;
}

interface ICodeAnalysisSettingsSupported {
    readonly eslintBrowserConfig: string;
    readonly ignoreCodeAnalysisByDefault: boolean;
    readonly isCodeAnalysisUnsupported: false;
}

type CodeAnalysisSettings = ICodeAnalysisSettingsUnsupported | ICodeAnalysisSettingsSupported;

interface ICodeSigningSettingsUnsupported {
    readonly skipCodeSigning: true;
}

interface ICodeSigningSettingsSupported {
    readonly codeSigningKeyFile: string;
    readonly codeSigningPublicKey: string;
    readonly skipCodeSigning: false;
}

type CodeSigningSettings = ICodeSigningSettingsUnsupported | ICodeSigningSettingsSupported;

interface IStorageSettings {
    readonly gitpath: string;
    readonly releasepath: string;
    readonly tmpcodepath: string;
}

interface INugetSettings {
    readonly nugetApiKey: string;
    readonly nugetHost: string;
}

interface ISmtpSettings {
    readonly smtp: {
        readonly auth: {
            readonly pass: string;
            readonly user: string;
        },
        readonly host: string;
        readonly receiver: string;
        readonly sender: string;
    };
}

interface ISiteSettings {
    readonly port: number | string;
    readonly siteRoot: string;
    readonly viewspath: string;
    readonly faviconpath: string;
    readonly staticcontentpath: string;
}

interface IGithubSettings {
    readonly createGithub: (repoOwner: string) => Github;
    readonly githubSiteRoot: string;
}

export type Settings = IBuilderSettings & CodeAnalysisSettings & CodeSigningSettings & IStorageSettings & INugetSettings & ISmtpSettings & ISiteSettings & IGithubSettings;
