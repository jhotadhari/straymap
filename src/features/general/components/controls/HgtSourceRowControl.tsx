/**
 * External dependencies
 */
import {
	Dispatch,
	SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { StyleSheet, TextProps, View } from 'react-native';
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
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { OptionBase } from '../../../../types';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import RadioListItem from '../../../../components/generic/wrapper/RadioListItem';
import HintLink from '../../../../components/generic/primitives/HintLink';
import { HgtDirPath } from '../../../baseMap/types';
import { AbsPath } from '../../../dirs/types';
import { sharedStyles } from '../../../../sharedStyles';
import { logError } from '../../../../lib/utils';
import { ErrorToastContext } from '../../../../components/ErrorToast/Context';
import useAsyncBusy from '../../../../compose/useAsyncBusy';
import LoadingIndicator from '../../../../components/generic/primitives/LoadingIndicator';
import { selectHgtDirPath } from '../../../baseMap/selectors';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { setHgtDirPath } from '../../../baseMap/slice';

const HgtSourceRowControl = ({
	dirs,
	options,
	optKey,
	setOptions,
	fallbackAppHgt = false,
	onlyThreeSeconds = false,
	canDeselect = false,
	modalOnly = false,
	modalVisible: modalVisibleProp,
	setModalVisible: setModalVisibleProp,
	modalHeader: modalHeaderProp,
}: {
	dirs: AbsPath[];
	options: object;
	optKey: string;
	setOptions: (options: object) => void;
	fallbackAppHgt?: boolean;
	onlyThreeSeconds?: boolean;
	canDeselect?: boolean;
	modalOnly?: boolean;

	modalVisible?: boolean;
	setModalVisible?: Dispatch<SetStateAction<boolean>>;
	modalHeader?: string;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const { showError } = useContext(ErrorToastContext);

	const [modalVisibleState, setModalVisibleState] = useState(false);
	const modalVisible = undefined === modalVisibleProp ? modalVisibleState : modalVisibleProp;
	const setModalVisible =
		undefined === setModalVisibleProp ? setModalVisibleState : setModalVisibleProp;

	const [modalVisibleApp, setModalVisibleApp] = useState(false);

	const opts: OptionBase[] = useMemo(() => {
		const result: OptionBase[] = fallbackAppHgt
			? [
					{
						key: 'appHgt',
						label: t('baseMap.useAppHgt'),
					},
				]
			: [];
		[...dirs].forEach((dir: AbsPath) => {
			result.push({
				key: dir,
				label: dir,
			});
		});
		result.push({
			key: 'custom',
			label: t('custom'),
		});
		return result;
	}, [
		fallbackAppHgt,
		dirs,
		t,
	]);

	const appHgtDirPath = useAppSelector(selectHgtDirPath);

	const getInitialSelectedOpt = (): null | 'custom' | 'appHgt' | HgtDirPath => {
		if (get(options, optKey)) {
			const opt = opts.find((opt) => opt.key === get(options, optKey));
			return opt ? (get(opt, 'key', null) as null | HgtDirPath) : 'custom';
		} else if (fallbackAppHgt) {
			return 'appHgt';
		} else {
			return null;
		}
	};

	const [selectedOpt, setSelectedOpt] = useState<null | 'custom' | 'appHgt' | HgtDirPath>(
		getInitialSelectedOpt()
	);

	const [customUri, setCustomUri] = useState<undefined | `content://${string}`>(
		'string' === typeof get(options, optKey, '') &&
			get(options, optKey, '').startsWith('content://')
			? (get(options, optKey) as `content://${string}`)
			: undefined
	);

	useEffect(() => {
		let newValue;
		switch (selectedOpt) {
			case 'custom':
				newValue = customUri;
				break;
			case 'appHgt':
				newValue = undefined;
				break;
			default:
				newValue = selectedOpt;
		}
		setOptions({
			...options,
			[optKey]: newValue,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedOpt, customUri]);

	const styleHintLarge = useMemo(() => [theme.fonts.bodyLarge, styles.hintLarge], [theme]);

	const [isPicking, runOpenDocumentTree] = useAsyncBusy(openDocumentTree);

	const handleOptionPress = useCallback(
		(opt: OptionBase) => {
			if (opt.key === selectedOpt) {
				if (canDeselect) {
					setSelectedOpt(null);
					setCustomUri(undefined);
				}
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
			setModalVisible,
			canDeselect,
		]
	);

	const handleCloseModal = useCallback(() => setModalVisible(false), [setModalVisible]);

	const handleOpenModal = useCallback(() => setModalVisible(true), [setModalVisible]);

	const dispatch = useAppDispatch();

	const handleSetHgtDirPath = useCallback(
		(options: object) => {
			dispatch(setHgtDirPath(get(options, 'hgtDirPath') || undefined));
		},
		[dispatch]
	);

	const controlNode = useMemo(() => {
		let label;
		if (selectedOpt) {
			if ('custom' === selectedOpt && customUri) {
				label = customUri
					.replace('content://', 'content:// ')
					.slice(0, Math.min(customUri.length - 1, 30));
			} else if ('appHgt' === selectedOpt) {
				label = t('baseMap.useAppHgt');
			} else {
				label = get(
					opts.find((opt) => opt.key === selectedOpt),
					'label',
					''
				);
			}
		} else {
			if (fallbackAppHgt) {
				label = t('baseMap.useAppHgt');
			} else {
				label = t('selected.none');
			}
		}
		return (
			<View style={styles.flexRow}>
				<ButtonHighlight onPress={handleOpenModal}>
					<Text>{label}</Text>
				</ButtonHighlight>
				{'appHgt' === selectedOpt && fallbackAppHgt && !appHgtDirPath && (
					<Text>{t('notConfigured')}</Text>
				)}
				{'appHgt' === selectedOpt && fallbackAppHgt && (
					<ButtonHighlight
						mode={appHgtDirPath ? 'text' : 'outlined'}
						style={appHgtDirPath ? undefined : { borderColor: theme.colors.error }}
						onPress={() => {
							setModalVisibleApp(true);
						}}
					>
						<Text>{t('baseMap.openAppHgt')}</Text>
					</ButtonHighlight>
				)}
			</View>
		);
	}, [
		t,
		theme,
		handleOpenModal,
		selectedOpt,
		customUri,
		fallbackAppHgt,
		opts,
		appHgtDirPath,
	]);

	const modalHeader = modalHeaderProp ?? t('map.selectDemDir');

	const labelStyle: TextProps['style'] = useMemo(() => [theme.fonts.bodyMedium], [theme]);

	const modalNode = useMemo(
		() =>
			modalVisible && (
				<ModalWrapper
					visible={modalVisible}
					backgroundBlur={false}
					onDismiss={handleCloseModal}
					headerLabel={modalHeader}
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
									labelStyle={labelStyle}
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
				</ModalWrapper>
			),
		[
			handleOptionPress,
			labelStyle,
			selectedOpt,
			modalVisible,
			handleCloseModal,
			isPicking,
			customUri,
			modalHeader,
			opts,
		]
	);

	if (modalOnly) {
		return modalNode;
	}

	return (
		<InfoLabelRow
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
			{modalNode}

			<View style={sharedStyles.flexRowCenter}>
				{controlNode}

				{'appHgt' === selectedOpt && fallbackAppHgt && (
					<HgtSourceRowControl
						options={{ hgtDirPath: appHgtDirPath }}
						setOptions={handleSetHgtDirPath}
						optKey={'hgtDirPath'}
						dirs={dirs}
						onlyThreeSeconds={true}
						canDeselect={true}
						modalVisible={modalVisibleApp}
						setModalVisible={setModalVisibleApp}
						modalOnly={true}
					/>
				)}
			</View>
		</InfoLabelRow>
	);
};

const styles = StyleSheet.create({
	hint: { marginTop: 20 },
	hintLarge: { marginTop: 20 },
	optRow: { marginBottom: 18 },
	okButton: { marginTop: 10 },
	flexRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 8,
	},
});

export default HgtSourceRowControl;
