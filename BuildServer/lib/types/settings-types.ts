import * as Github from "github";

interface IBuilderSettings {
    builderExecutable: string;
}

interface ICodeAnalysisSettingsUnsupported {
    isCodeAnalysisUnsupported: true;
}

interface ICodeAnalysisSettingsSupported {
    eslintBrowserConfig: string;
    ignoreCodeAnalysisByDefault: boolean;
    isCodeAnalysisUnsupported: false;
}

type CodeAnalysisSettings = ICodeAnalysisSettingsUnsupported | ICodeAnalysisSettingsSupported;

interface ICodeSigningSettingsUnsupported {
    skipCodeSigning: true;
}

interface ICodeSigningSettingsSupported {
    codeSigningKeyFile: string;
    codeSigningPublicKey: string;
    skipCodeSigning: false;
}

type CodeSigningSettings = ICodeSigningSettingsUnsupported | ICodeSigningSettingsSupported;

interface IStorageSettings {
    gitpath: string;
    releasepath: string;
    tmpcodepath: string;
}

interface INugetSettings {
    nugetApiKey: string;
    nugetHost: string;
}

interface ISmtpSettings {
    smtp: {
        auth: {
            pass: string;
            user: string;
        },
        host: string;
        receiver: string;
        sender: string;
    };
}

interface ISiteSettings {
    port: number | string;
    siteRoot: string;
    viewspath: string;
    faviconpath: string;
    staticcontentpath: string;
}

interface IGithubSettings {
    createGithub: (repoOwner: string) => Github;
}

export type Settings = IBuilderSettings & CodeAnalysisSettings & CodeSigningSettings & IStorageSettings & INugetSettings & ISmtpSettings & ISiteSettings & IGithubSettings;
