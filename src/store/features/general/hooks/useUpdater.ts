/**
 * External dependencies
 */
import { get } from 'lodash-es';
import { UpdateResults } from '../types';
import semverCompare from 'semver-compare';

/**
 * Internal dependencies
 */
import packageJson from '../../../../../package.json';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectInstalledVersion } from '../selectors';
import { useCallback, useEffect, useState } from 'react';
import { setInstalledVersion } from '../generalSlice';

const updateCbs: {
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

const useUpdater = ({ ready }: { ready: boolean }) => {
	const dispatch = useAppDispatch();

	const installedVersionStore = useAppSelector(selectInstalledVersion);

	const [isUpdating, setIsUpdating] = useState<boolean | UpdateResults | 'isDowngrade'>(true);

	const runUpdates = useCallback(
		(updateCbsKeys: string[]): Promise<UpdateResults> =>
			new Promise((resolve, reject) => {
				updateCbsKeys.sort(semverCompare);
				const results: UpdateResults = {};
				resolve(
					[...updateCbsKeys].reduce(
						(accumulatorPromise: Promise<UpdateResults>, versionFrom: string, idx) => {
							const cb = (results: UpdateResults): Promise<UpdateResults> =>
								new Promise((resolveCb) => {
									const updateCb = get(updateCbs, versionFrom);
									const versionFromNext = get(
										updateCbsKeys,
										idx + 1,
										packageJson.version
									);
									setIsUpdating({
										...results,
										[versionFrom]: { state: 'updating' },
									});
									if (updateCb) {
										updateCb(results, versionFrom).then((results) => {
											switch (get(results, [versionFrom, 'state'])) {
												case 'success':
													dispatch(setInstalledVersion(versionFromNext));
													resolveCb(results);
													break;
												case 'failed':
													setIsUpdating(results);
													reject(results);
													break;
											}
										});
									} else {
										dispatch(setInstalledVersion(versionFromNext));
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
			}),
		[]
	);

	useEffect(() => {
		if (ready) {
			if (undefined === installedVersionStore) {
				dispatch(setInstalledVersion(packageJson.version));
			} else if (true === isUpdating) {
				// the initial value. That should only run on init when ready. Thats why the following is wrapped in a timeout.
				setTimeout(() => {
					switch (semverCompare(packageJson.version, installedVersionStore)) {
						case 1: // current version (packageJson.version) is greater than installedVersionStore.
							// updateCbs keys to run updates for. All that ones lower than packageJson.version and same or higher than installedVersion.
							const updateCbsKeys = Object.keys(updateCbs).filter((cbVersion) => {
								return (
									1 === semverCompare(packageJson.version, cbVersion) &&
									1 > semverCompare(installedVersionStore, cbVersion)
								);
							});
							// Run updates, then check if all updates are success.
							runUpdates(updateCbsKeys)
								.then((results: UpdateResults) => {
									if (
										Object.values(results).every(
											(result) => 'success' === result.state
										)
									) {
										setIsUpdating(false);
									}
								})
								.catch(() => null); // catch the error, do nothing, no need to handle it.
							break;
						case -1: // current version (packageJson.version) is lower than installedVersionStore.
							setIsUpdating('isDowngrade');
							break;
						default:
							setIsUpdating(false);
					}
				}, 0);
			}
		}
	}, [
		runUpdates,
		ready,
		isUpdating,
		installedVersionStore,
	]);

	return {
		isUpdating,
		setIsUpdating,
	};
};

export default useUpdater;
