/* tslint:disable:max-classes-per-file variable-name */
declare module "json-parse-safe" {
    const JSONParse: (json: string) => { error: Error | string | null, value: any };
    export = JSONParse;
}
