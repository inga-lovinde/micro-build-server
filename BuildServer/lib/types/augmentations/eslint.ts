/* tslint:disable:max-classes-per-file variable-name */
declare module "eslint" {
    interface IMessage {
        readonly column: any;
        readonly fatal: boolean;
        readonly line: any;
        readonly lineId: any;
        readonly message: any;
        readonly ruleId: any;
        readonly severity: number;
    }

    interface IResult {
        readonly messages: IMessage[];
    }

    export class CLIEngine {
        public constructor(params: { configFile: string });
        public executeOnFiles(files: string[]): { results: IResult[] };
    }
}
