/* tslint:disable:max-classes-per-file variable-name */
declare module "graceful-fs" {
    import * as fsContent from "fs";

    export function gracefulify(fs: typeof fsContent): void;
}
