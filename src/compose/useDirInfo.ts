/**
 * External dependencies
 */
import { useState, useEffect } from 'react';

/**
 * Internal dependencies
 */
import { FsModule } from '../nativeModules';
import { type AbsPath } from '../types';

type NavChild = {
	name: string;
	isDir: boolean;
	isFile: boolean;
	canRead: boolean;
	canExecute: boolean;
};

type DirInfo = {
	navParent: null | string;
	navChildren: null | NavChild[];
};

const useDirInfo = ( navDir : AbsPath ) : DirInfo => {
	const [navParent,setNavParent] = useState<null | string>( null );
	const [navChildren,setNavChildren] = useState<null | NavChild[]>( null );
	useEffect( () => {
		if ( navDir ) {
			FsModule.getInfo( navDir ).then( ( info : DirInfo ) => {
				if ( info.navParent ) {
					setNavParent( info.navParent );
				}
				if ( info.navChildren ) {
					setNavChildren( info.navChildren );
				}
			} );
		}
	}, [navDir] );
	return { navParent, navChildren };
}

export default useDirInfo;