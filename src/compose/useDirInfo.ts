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

const addDepthToChildren = ( cs: NavChild[], depth: number ) => [...cs].map( c => ( {...c, depth } ) );

const getNewNavChildren = async ( navChildren: NavChild[], depth: number ) : Promise<NavChild[]> => {
	let newNavChildren = await Promise.all( [...navChildren].map( async( child ) => {
		if ( child.isDir ) {
			const childInfo : DirInfo = await FsModule.getInfo( child.name )
			let childNavChildren = await getNewNavChildren( childInfo?.navChildren || [], depth + 1 );
			return [
				...addDepthToChildren( [child], depth ),
				...addDepthToChildren( childNavChildren, depth + 1 ),
			];
		} else {
			return addDepthToChildren( [child], depth )[0];
		}
	} ) );
	newNavChildren = flatten( newNavChildren );
	return newNavChildren as NavChild[];
};

export const useDirsInfo = ( navDirs : AbsPath[], recursive?: boolean ) : DirInfoMap => {
	const [infos,setInfos] = useState<DirInfoMap>( {} );
	useEffect( () => {
		Promise.all( [...navDirs].map( ( navDir ) => {
			return new Promise( ( resolve : ( value: ( DirInfoMap | false ) ) => void ) => {
				FsModule.getInfo( navDir ).then( async ( info : DirInfo ) => {
					if ( info ) {
						if ( recursive && info.navChildren ) {
							let newNavChildren = await getNewNavChildren( info.navChildren, 0 );
							let newDirInfo: DirInfo = {
								...info,
								navChildren: newNavChildren,
							};
							resolve( { [navDir]: newDirInfo } );
						} else {
							resolve( { [navDir]: info } );
						}
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
