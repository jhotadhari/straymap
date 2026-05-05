
export type AbsPath = `/${string}`;

export type AbsPathsMap = { [value: string]: AbsPath[] };

export type NavChild = {
	name: string;
	isDir: boolean;
	isFile: boolean;
	canRead: boolean;
	canExecute: boolean;
	depth?: number;
};

export type DirInfo = {
	navParent?: string;
	navChildren?: NavChild[];
};

export type DirInfoMap = { [absPath: string]: DirInfo };