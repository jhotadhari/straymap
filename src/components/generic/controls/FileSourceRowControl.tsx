/**
 * External dependencies
 */
import {
	Dispatch,
	FC,
	ReactElement,
	ReactNode,
	SetStateAction,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import { openDocument } from 'react-native-scoped-storage';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../ButtonHighlight';
import { OptionBase } from '../../../types';
import InfoRowControl from './InfoRowControl';
import ModalWrapper from '../ModalWrapper';
import RadioListItem from '../RadioListItem';
import LoadingIndicator from '../LoadingIndicator';
import { AbsPath } from '../../../store/features/dirs/types';
import useDirsInfo from '../../../store/features/dirs/hooks/useDirsInfo';

interface Option extends OptionBase {
	key: string;
}

type OptsMap = { [value: string]: Option[] };

const getLabelFromUri = (uri?: `content://${string}`) => {
	if (!uri) {
		return '';
	}
	const parts = uri.split('%2F');
	return parts.length > 0 ? parts[parts.length - 1] : '';
};

export type AlternativeButtonType =
	| null
	| (({
			setModalVisible,
	  }: {
			setModalVisible?: Dispatch<SetStateAction<boolean>>;
	  }) => ReactElement);

const FileSourceRowControl: FC<{
	filePattern?: RegExp;
	extensions?: string[];
	dirs?: AbsPath[];
	value?: string;
	onSelect: (newValue?: string | undefined) => void;
	label: string;
	header?: string;
	Info?: ReactNode | string;
	After?: ReactNode;
	filesHeading?: string;
	noFilesHeading?: string;
	hasCustom?: boolean;
	initialOptsMap?: OptsMap;
	AlternativeButton?: AlternativeButtonType;
}> = ({
	filePattern,
	extensions,
	dirs,
	value,
	onSelect,
	label,
	header,
	Info,
	After,
	filesHeading,
	noFilesHeading,
	hasCustom,
	initialOptsMap = {},
	AlternativeButton = null,
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const [modalVisible, setModalVisible] = useState(false);

	const dirsInfos = useDirsInfo({
		navDirs: dirs || [],
		extensions,
		recursive: true,
	});

	const [optsMap, setOptsMap] = useState<OptsMap>({});

	useEffect(() => {
		let newOptsMap = { ...initialOptsMap };
		if (dirsInfos) {
			Object.keys(dirsInfos).map((key) => {
				const dirInfo = dirsInfos[key];
				newOptsMap = {
					...newOptsMap,
					[key]:
						dirInfo && dirInfo?.navChildren
							? [...dirInfo.navChildren]
									.filter(
										(child) =>
											child.isFile &&
											child.canRead &&
											(filePattern ? filePattern.test(child.name) : true)
									)
									.map((child) => {
										const nameArr = child.name.split('/');
										return {
											key: child.name,
											label: nameArr
												.slice(-(child.depth ? child.depth + 1 : 1))
												.join('/'),
										};
									})
							: [],
				};
			});
		}
		if (hasCustom) {
			newOptsMap = {
				...newOptsMap,
				['']: [
					{
						key: 'custom',
						label: t('custom'),
					},
				],
			};
		}

		setOptsMap(newOptsMap);
	}, [
		dirsInfos,
		filePattern,
		hasCustom,
		t,
	]);

	const getInitialSelectedOpt = useCallback(() => {
		if (value) {
			const opt = Object.values(optsMap)
				.flat()
				.find((opt) => opt.key === value);
			return opt
				? get(opt, 'key')
				: hasCustom && (value as string).startsWith('content://')
					? 'custom'
					: undefined;
		} else {
			return undefined;
		}
	}, [
		value,
		optsMap,
		hasCustom,
	]);

	const [selectedOpt, setSelectedOpt] = useState<undefined | string>(undefined);

	const [customUri, setCustomUri] = useState<undefined | `content://${string}`>(
		value?.startsWith('content://') ? (value as `content://${string}`) : undefined
	);

	useEffect(() => {
		if (undefined === selectedOpt) {
			setSelectedOpt(getInitialSelectedOpt());
		}
	}, [optsMap, getInitialSelectedOpt]);

	useEffect(() => {
		if (selectedOpt) {
			onSelect(selectedOpt === 'custom' && undefined !== customUri ? customUri : selectedOpt);
		}
	}, [selectedOpt,customUri]);

	return (
		<InfoRowControl
			label={label}
			Info={Info}
		>
			{modalVisible && (
				<ModalWrapper
					visible={modalVisible}
					backgroundBlur={false}
					onDismiss={() => setModalVisible(false)}
					header={header || label}
				>
					{Object.keys(optsMap).map((key) => {
						const opts = optsMap[key];
						return (
							<View
								key={key}
								style={{
									marginBottom: 18,
								}}
							>
								{opts.length > 0 && (
									<View>
										{key.startsWith('/') && <Text>{filesHeading || ''}:</Text>}
										<Text
											style={key.startsWith('/') ? theme.fonts.bodySmall : {}}
										>
											{key}
										</Text>
										{[...opts].map((opt) => (
											<RadioListItem
												key={opt.key}
												opt={opt}
												onPress={() => {
													if (opt.key === selectedOpt) {
														setSelectedOpt(undefined);
													} else {
														if ('custom' === opt.key) {
															openDocument(false)
																.then((file) => {
																	setCustomUri(
																		file.uri as `content://${string}`
																	);
																	setSelectedOpt('custom');
																	setModalVisible(false);
																})
																.catch((err: any) =>
																	console.log(err)
																);
														} else {
															setCustomUri(undefined);
															setSelectedOpt(opt.key);
															setModalVisible(false);
														}
													}
												}}
												labelStyle={theme.fonts.bodyMedium}
												labelExtractor={(a) => a.label}
												descExtractor={(a) =>
													'custom' === a.key
														? customUri
															? customUri?.replace(
																	'content://',
																	'content:// '
																)
															: null
														: ''
												}
												status={
													opt.key === selectedOpt
														? 'checked'
														: 'unchecked'
												}
											/>
										))}
									</View>
								)}

								{opts.length === 0 && (
									<View>
										<Text>{noFilesHeading || ''}:</Text>
										<Text style={theme.fonts.bodySmall}>{key}</Text>
									</View>
								)}
							</View>
						);
					})}

					<ButtonHighlight
						style={{ marginTop: 10, marginBottom: 40 }}
						onPress={() => {
							setModalVisible(false);
						}}
						mode="contained"
						buttonColor={get(theme.colors, 'successContainer')}
						textColor={get(theme.colors, 'onSuccessContainer')}
					>
						<Text>{t('ok')}</Text>
					</ButtonHighlight>
				</ModalWrapper>
			)}

			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					width: '65%',
				}}
			>
				{!AlternativeButton && dirsInfos && Object.keys(dirsInfos).length > 0 && (
					<ButtonHighlight
						style={{ marginTop: 3 }}
						onPress={() => setModalVisible(true)}
					>
						<Text>
							{t(
								'custom' === selectedOpt
									? getLabelFromUri(customUri)
									: selectedOpt
										? get(
												Object.values(optsMap)
													.flat()
													.find((opt) => opt.key === selectedOpt),
												'label',
												''
											)
										: 'selected.none'
							)}
						</Text>
					</ButtonHighlight>
				)}

				{!AlternativeButton && dirsInfos && Object.keys(dirsInfos).length === 0 && (
					<LoadingIndicator />
				)}

				{!!AlternativeButton && <AlternativeButton setModalVisible={setModalVisible} />}

				{!!After && dirsInfos && Object.keys(dirsInfos).length !== 0 && After}
			</View>
		</InfoRowControl>
	);
};

export default FileSourceRowControl;
