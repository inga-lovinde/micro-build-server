/* tslint:disable:max-classes-per-file variable-name */
declare module "cssnano" {
    // cssnano invokes postcss; all types are from postcss API reference

    interface IResult {
        content: string;
    }

    export function process(content: string): Promise<IResult>;
}
