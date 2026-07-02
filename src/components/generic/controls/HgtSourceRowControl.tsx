/**
 * External dependencies
 */
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import { openDocumentTree } from 'react-native-scoped-storage';
import { sprintf } from 'sprintf-js';

/**
 * react-native-mapsforge-vtm dependencies
 */

/**
 * Internal dependencies
 */
import ButtonHighlight from '../ButtonHighlight';
import { OptionBase } from '../../../types';
import InfoRowControl from './InfoRowControl';
import ModalWrapper from '../ModalWrapper';
import RadioListItem from '../RadioListItem';
import HintLink from '../HintLink';
import { HgtDirPath } from '../../../store/features/baseMap/types';
import { AbsPath } from '../../../store/features/dirs/types';
import { sharedStyles } from '../../../sharedStyles';
import { logError } from '../../../lib/utils';
import { ErrorToastContext } from '../../ErrorToast/Context';
import useAsyncBusy from '../../../compose/useAsyncBusy';
import LoadingIndicator from '../LoadingIndicator';

const HgtSourceRowControl = ({
	dirs,
	options,
	optKey,
	setOptions,
	onlyThreeSeconds = false,
}: {
	dirs: AbsPath[];
	options: object;
	optKey: string;
	setOptions: (options: object) => void;
	onlyThreeSeconds?: boolean;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const { showError } = useContext(ErrorToastContext);

	const [modalVisible, setModalVisible] = useState(false);

	let opts: OptionBase[] = [
		{
			key: 'custom',
			label: t('custom'),
		},
	];
	[...dirs].reverse().forEach((dir: AbsPath) => {
		opts = [
			{
				key: dir,
				label: dir,
			},
			...opts,
		];
	});

	const getInitialSelectedOpt = (): null | 'custom' | HgtDirPath => {
		if (get(options, optKey)) {
			const opt = opts.find((opt) => opt.key === get(options, optKey));
			return opt ? (get(opt, 'key', null) as null | HgtDirPath) : 'custom';
		} else {
			return null;
		}
	};

	const [selectedOpt, setSelectedOpt] = useState<null | 'custom' | HgtDirPath>(
		getInitialSelectedOpt()
	);

	const [customUri, setCustomUri] = useState<undefined | `content://${string}`>(
		'string' === typeof get(options, optKey, '') &&
			get(options, optKey, '').startsWith('content://')
			? (get(options, optKey) as `content://${string}`)
			: undefined
	);

	useEffect(() => {
		setOptions({
			...options,
			[optKey]: 'custom' === selectedOpt ? customUri : selectedOpt,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedOpt]);

	const styleHintLarge = useMemo(() => [theme.fonts.bodyLarge, styles.hintLarge], [theme]);

	const [isPicking, runOpenDocumentTree] = useAsyncBusy(openDocumentTree);

	const handleOptionPress = useCallback(
		(opt: OptionBase) => {
			if (opt.key === selectedOpt) {
				setSelectedOpt(null);
				setCustomUri(undefined);
			} else {
				if (opt.key === 'custom') {
					runOpenDocumentTree(true)
						.then((dir) => {
							setCustomUri(dir.uri as `content://${string}`);
							setSelectedOpt('custom');
							setModalVisible(false);
						})
						.catch((err) => {
							logError('HgtSourceRowControl.openDocumentTree', err);
							showError(sprintf(t('errorGeneric'), err?.message ?? String(err)));
						});
				} else {
					setCustomUri(undefined);
					setSelectedOpt(opt.key as HgtDirPath);
					setModalVisible(false);
				}
			}
		},
		[
			selectedOpt,
			showError,
			t,
			runOpenDocumentTree,
		]
	);

	const handleCloseModal = useCallback(() => setModalVisible(false), []);

	const handleOpenModal = useCallback(() => setModalVisible(true), []);

	return (
		<InfoRowControl
			label={t('map.demDir')}
			Info={
				<View>
					<Text>{t('hint.maps.demDir')}</Text>
					{onlyThreeSeconds && (
						<Text style={styles.hint}>{t('hint.maps.demOnly3Sec')}</Text>
					)}
					<Text style={styleHintLarge}>{t('demDownloads') + ':'}</Text>
					<HintLink
						label={t('hint.link.digitalEleData')}
						url={'https://viewfinderpanoramas.org/dem3.html'}
					/>
					<HintLink
						label={t('hint.link.digitalEleDataCoverage')}
						url={
							'https://viewfinderpanoramas.org/Coverage%20map%20viewfinderpanoramas_org3.htm'
						}
					/>
					<Text style={styleHintLarge}>{t('moreInformation') + ':'}</Text>
					<HintLink
						label={'NASA Shuttle Radar Topography Mission (SRTM)'}
						url={'https://wiki.openstreetmap.org/wiki/SRTM'}
					/>
					<HintLink
						label={'OpenDEM Arc2Meters Converter'}
						url={'https://www.opendem.info/arc2meters.html'}
					/>
				</View>
			}
		>
			{modalVisible && (
				<ModalWrapper
					visible={modalVisible}
					backgroundBlur={false}
					onDismiss={handleCloseModal}
					header={t('map.selectDemDir')}
				>
					{opts.map((opt) => {
						return (
							<View
								key={opt.key}
								style={styles.optRow}
							>
								<RadioListItem
									key={opt.key}
									opt={opt}
									onPress={() => handleOptionPress(opt)}
									labelNode={
										isPicking && 'custom' === opt.key ? (
											<LoadingIndicator size="small" />
										) : undefined
									}
									labelStyle={theme.fonts.bodyMedium}
									labelExtractor={(a) => a.label}
									descExtractor={
										opt.key === 'custom'
											? () =>
													customUri
														? customUri?.replace(
																'content://',
																'content:// '
															)
														: null
											: undefined
									}
									status={opt.key === selectedOpt ? 'checked' : 'unchecked'}
								/>
							</View>
						);
					})}

					<ButtonHighlight
						style={styles.okButton}
						onPress={handleCloseModal}
						mode="contained"
						buttonColor={get(theme.colors, 'successContainer')}
						textColor={get(theme.colors, 'onSuccessContainer')}
					>
						<Text>{t('ok')}</Text>
					</ButtonHighlight>
				</ModalWrapper>
			)}

			<View style={sharedStyles.flexRowCenter}>
				<ButtonHighlight onPress={handleOpenModal}>
					<Text>
						{t(
							selectedOpt
								? 'custom' === selectedOpt && customUri
									? customUri
											?.replace('content://', 'content:// ')
											.slice(0, Math.min(customUri.length - 1, 30))
									: get(
											opts.find((opt) => opt.key === selectedOpt),
											'label',
											''
										)
								: 'selected.none'
						)}
					</Text>
				</ButtonHighlight>
			</View>
		</InfoRowControl>
	);
};

const styles = StyleSheet.create({
	hint: { marginTop: 20 },
	hintLarge: { marginTop: 20 },
	optRow: { marginBottom: 18 },
	okButton: { marginTop: 10 },
});

export default HgtSourceRowControl;
