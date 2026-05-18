import { EnhancedStore } from '@reduxjs/toolkit';
import semverCompare from 'semver-compare';
import { get } from 'lodash-es';

import { UpdateResults } from './types';
import { setInstalledVersion, setIsUpdating, UpdaterState } from './updaterSlice';
import packageJson from '../../../../package.json';

class Updater {
	store: EnhancedStore;

	updateCbs: {
		[versionFrom: string]: // the version updating from
			null | ((results: UpdateResults, versionFrom: string) => Promise<UpdateResults>); // function to run when updating from this version.
	} = {
		['0.0.2']: null,
		// ['x.x.x']: ( results: UpdateResults, versionFrom ) => new Promise( resolve => {
		//     setTimeout( () => {
		//         const success = true;
		//         if ( success ) {
		//             resolve( {
		//                 ...results,
		//                 [versionFrom]: {
		//                     state: 'success',
		//                 },
		//             } );
		//         } else {
		//             resolve( {
		//                 ...results,
		//                 [versionFrom]: {
		//                     state: 'failed',
		//                     msg: 'Some Error wtf'
		//                 },
		//             } );
		//         }
		//     }, 500 );
		// } ),
	};

	constructor(store: EnhancedStore) {
		this.store = store;
		return this;
	}

	run(initialInstalledVersionStore: string) {
		return new Promise<void>((resolveRun) => {
			return new Promise<UpdaterState['isUpdating']>((resolve) => {
				switch (semverCompare(packageJson.version, initialInstalledVersionStore)) {
					case 1: // current version (packageJson.version) is greater than installedVersionStore.
						// updateCbs keys to run updates for. All that ones lower than packageJson.version and same or higher than installedVersion.
						const updateCbsKeys = Object.keys(this.updateCbs).filter((cbVersion) => {
							return (
								1 === semverCompare(packageJson.version, cbVersion) &&
								1 > semverCompare(initialInstalledVersionStore, cbVersion)
							);
						});
						// Run updates, then check if all updates are success.
						this.runUpdates(updateCbsKeys)
							.then((results: UpdateResults) => {
								if (
									Object.values(results).every(
										(result) => 'success' === result.state
									)
								) {
									resolve(false);
								}
							})
							.catch(() => null); // catch the error, do nothing, no need to handle it.
						break;
					case -1: // current version (packageJson.version) is lower than installedVersionStore.
						resolve('isDowngrade');
						break;
					default:
						resolve(false);
				}
			}).then((newIsUpdating: UpdaterState['isUpdating']) => {
				this.store.dispatch(setIsUpdating(newIsUpdating));
				resolveRun();
			});
		});
	}

	runUpdates(updateCbsKeys: string[]): Promise<UpdateResults> {
		return new Promise((resolve, reject) => {
			updateCbsKeys.sort(semverCompare);
			const results: UpdateResults = {};
			resolve(
				[...updateCbsKeys].reduce(
					(accumulatorPromise: Promise<UpdateResults>, versionFrom: string, idx) => {
						const cb = (results: UpdateResults): Promise<UpdateResults> =>
							new Promise((resolveCb) => {
								const updateCb = get(this.updateCbs, versionFrom);
								const versionFromNext = get(
									updateCbsKeys,
									idx + 1,
									packageJson.version
								);
								this.store.dispatch(
									setIsUpdating({
										...results,
										[versionFrom]: { state: 'updating' },
									})
								);
								if (updateCb) {
									updateCb(results, versionFrom).then((results) => {
										switch (get(results, [versionFrom, 'state'])) {
											case 'success':
												this.store.dispatch(
													setInstalledVersion(versionFromNext)
												);
												resolveCb(results);
												break;
											case 'failed':
												this.store.dispatch(setIsUpdating(results));
												reject(results);
												break;
										}
									});
								} else {
									this.store.dispatch(setInstalledVersion(versionFromNext));
									resolveCb({
										...results,
										[versionFrom]: { state: 'success' },
									});
								}
							});
						return accumulatorPromise.then((results) => cb(results));
					},
					Promise.resolve(results)
				)
			);
		});
	}
}

export default Updater;
