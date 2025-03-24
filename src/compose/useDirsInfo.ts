/**
 * External dependencies
 */
import { useState, useEffect } from 'react';

/**
 * Internal dependencies
 */
import { FsModule } from '../nativeModules';
import { type AbsPath } from '../types';
import { flatten } from 'lodash-es';

type NavChild = {
	name: string;
	isDir: boolean;
	isFile: boolean;
	canRead: boolean;
	canExecute: boolean;
	depth?: number;
};

type DirInfo = {
	navParent: null | string;
	navChildren: null | NavChild[];
};

type DirInfoMap = { [value: string]: DirInfo };

const useDirsInfo = (
	navDirs : AbsPath[],
	extensions?: string[],
	recursive?: boolean,
	start?: any
) : DirInfoMap => {
	const [infos,setInfos] = useState<DirInfoMap>( {} );
	useEffect( () => {
		if ( undefined === start || ( undefined !== start && start ) ) {
			Promise.all( [...navDirs].map( ( navDir ) => {
				return new Promise( ( resolve : ( value: ( DirInfoMap | false ) ) => void ) => {
					FsModule.getInfo(
						navDir,
						extensions && extensions.length ? extensions : null,
						!! recursive
					).then( async ( info : DirInfo ) => {
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
		}
	}, [
		navDirs.join( '' ),
		start
	] );

	return infos;
};

export default useDirsInfo;