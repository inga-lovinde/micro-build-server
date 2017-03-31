/* tslint:disable:max-classes-per-file variable-name */
declare module "nodegit" {
    export class Blob {
        public content(): Buffer;
    }

    export class Commit {
        // getTree(callback: (err: any, treeContent?: Tree) => void): Promise<Tree>;
        public getTree(): Promise<Tree>;
    }

    export class Remote {
        public static create(repo: Repository, name: string, url: string): Promise<Remote>;
        public fetch(refSpecs: string[]): Promise<number>;
    }

    export class Repository {
        public static init(path: string, is_bare: number): Promise<Repository>;
        public getCommit(oid: string): Promise<Commit>;
        public free(): void;
    }

    export class Tree {
        public entries(): TreeEntry[];
    }

    export class TreeEntry {
        public getBlob(callback: (err: any, blob?: Blob) => void): Promise<Tree>;
        public getTree(callback: (err: any, treeContent?: Tree) => void): Promise<Tree>;
        public isFile(): boolean;
        public isTree(): boolean;
        public name(): string;
    }
}
