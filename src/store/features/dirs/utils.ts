/**
 * External dependencies
 */
import { pick } from "lodash-es";

/**
 * Internal dependencies
 */
import { AbsPath } from "./types";

export const getDirInfoCacheId = ( params: {
	navDirs: AbsPath[],
	extensions?: string[],
	recursive?: boolean,
} ) => {
	const paramsStrict = {
		navDirs: params.navDirs,
		extensions: params?.extensions ?? [],
		recursive: params?.recursive ?? false,
	};
	// Sort and stringify.
	return JSON.stringify( pick( paramsStrict, Object.keys( paramsStrict ).sort()) );
};