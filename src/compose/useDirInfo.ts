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

type DirInfoMap = { [value: string]: DirInfo };

export const useDirInfo = ( navDir : AbsPath ) : DirInfo => {
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

export const useDirsInfo = ( navDirs : AbsPath[] ) : DirInfoMap => {
	const [infos,setInfos] = useState<DirInfoMap>( {} );
	useEffect( () => {
		Promise.all( [...navDirs].map( ( navDir ) => {
			return new Promise( ( resolve : ( value: ( DirInfoMap | false ) ) => void ) => {
				FsModule.getInfo( navDir ).then( ( info : DirInfo ) => {
					if ( info ) {
						resolve( { [navDir]: info } );
					} else {
						resolve( false );
					}
				} ).catch( ( err : any ) => {
					console.log( err );
					resolve( false );
				} );
			} );
		} ) ).then( ( maps : ( false | DirInfoMap )[] ) => {
			let newInfos = {};
			[...maps].map( ( dirInfoMap: DirInfoMap | false ) => {
				if ( dirInfoMap ) {
					newInfos = {
						...newInfos,
						...dirInfoMap,
					};
				}
			} )
			setInfos( newInfos );
		} ).catch( ( err : any ) => console.log( err ) );
	}, [navDirs.join( '' )] );

	return infos;
};
