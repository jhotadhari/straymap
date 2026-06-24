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
	useMemo,
	useState,
} from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
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
import dayjs from 'dayjs';

interface OptionWithDesc extends OptionBase {
	desc?: string;
}

type OptionsByPathType = Record<string, OptionWithDesc[]>;

export type AlternativeButtonType =
	| null
	| (({
			setModalVisible,
	  }: {
			setModalVisible?: Dispatch<SetStateAction<boolean>>;
	  }) => ReactElement);

const getLabelFromUri = (uri?: `content://${string}`) => {
	if (!uri) {
		return '';
	}
	const parts = uri.split('%2F');
	return parts.length > 0 ? parts[parts.length - 1] : '';
};

const Option: FC<{
	option: OptionWithDesc;
	selectedOpt: string | undefined;
	setSelectedOpt: Dispatch<SetStateAction<string | undefined>>;
	customUri: `content://${string}` | undefined;
	setCustomUri: Dispatch<SetStateAction<`content://${string}` | undefined>>;
}> = ({ option, selectedOpt, setSelectedOpt, customUri, setCustomUri }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const handlePress = useCallback(() => {
		if (option.key === selectedOpt) {
			setSelectedOpt(undefined);
		} else {
			if ('custom' === option.key) {
				openDocument(false)
					.then((file) => {
						setCustomUri(file.uri as `content://${string}`);
						setSelectedOpt('custom');
					})
					.catch((err: any) => console.log(err));
			} else {
				setCustomUri(undefined);
				setSelectedOpt(option.key);
			}
		}
	}, [
		option,
		selectedOpt,
		setSelectedOpt,
		setCustomUri,
	]);

	return (
		<RadioListItem
			opt={option}
			onPress={handlePress}
			labelStyle={theme.fonts.bodyMedium}
			labelExtractor={(a) => a.label}
			descExtractor={(a) =>
				'custom' === a.key
					? customUri
						? customUri?.replace('content://', 'content:// ')
						: null
					: ''
			}
			status={option.key === selectedOpt ? 'checked' : 'unchecked'}
		/>
	);
};

const CreateNewOption: FC<{
	path: string;
	newOptionLabel?: string;
	extensions?: string[];
	selectedOpt: string | undefined;
	setSelectedOpt: Dispatch<SetStateAction<string | undefined>>;
	customUri: `content://${string}` | undefined;
	setCustomUri: Dispatch<SetStateAction<`content://${string}` | undefined>>;
}> = ({
	path,
	newOptionLabel,
	extensions,
	selectedOpt,
	setSelectedOpt,
	customUri,
	setCustomUri,
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const [fileNameTemp, setFileNameTemp] = useState<undefined | string>(undefined);

	const getNewSelectedOptionString = useCallback(
		(filename: string) =>
			[
				path,
				filename + (extensions && extensions.length ? '.' + extensions[0] : ''),
			].join('/'),
		[path, extensions]
	);

	const { newFileNameTemp, newSelectedOpt } = useMemo(() => {
		const newFileNameTemp =
			fileNameTemp && fileNameTemp.length
				? fileNameTemp
				: dayjs().format('YYYY-MM-DDTHH-mm-ss');
		return {
			newFileNameTemp,
			newSelectedOpt: getNewSelectedOptionString(newFileNameTemp),
		};
	}, [fileNameTemp, getNewSelectedOptionString]);

	const handleChangeText = useCallback(
		(newVal: string) => {
			setFileNameTemp(newVal);
			setSelectedOpt(getNewSelectedOptionString(newVal));
		},
		[getNewSelectedOptionString]
	);

	const labelNode = useMemo(() => {
		return (
			fileNameTemp && (
				<TextInput
					underlineColor="transparent"
					dense={true}
					theme={{
						fonts: {
							bodyLarge: {
								...theme.fonts.bodySmall,
								fontFamily: 'sans-serif',
							},
						},
					}}
					onChangeText={handleChangeText}
					value={fileNameTemp}
				/>
			)
		);
	}, [fileNameTemp, handleChangeText]);

	const newOption: OptionWithDesc = useMemo(
		() => ({
			key: 'newOption',
			label: newOptionLabel ?? 'newOption',
		}),
		[newOptionLabel]
	);

	const handlePress = useCallback(() => {
		if (fileNameTemp && fileNameTemp.length) {
			setCustomUri(undefined);
			setSelectedOpt(newSelectedOpt);
		}
		if (!fileNameTemp) {
			setFileNameTemp(newFileNameTemp);
			setCustomUri(undefined);
			setSelectedOpt(newSelectedOpt);
		}
	}, [
		fileNameTemp,
		newFileNameTemp,
		newSelectedOpt,
		setCustomUri,
		setSelectedOpt,
	]);

	return (
		<RadioListItem
			opt={newOption}
			onPress={handlePress}
			labelNode={labelNode}
			labelStyle={theme.fonts.bodyMedium}
			labelExtractor={(a) => a.label}
			descExtractor={(a) =>
				'custom' === a.key
					? customUri
						? customUri?.replace('content://', 'content:// ')
						: null
					: ''
			}
			status={selectedOpt === newSelectedOpt ? 'checked' : 'unchecked'}
		/>
	);
};

const OptionsByPath: FC<{
	options: OptionWithDesc[];
	path: string;
	filesHeading?: string;
	noFilesHeading?: string;
	selectedOpt: string | undefined;
	setSelectedOpt: Dispatch<SetStateAction<string | undefined>>;
	customUri: `content://${string}` | undefined;
	setCustomUri: Dispatch<SetStateAction<`content://${string}` | undefined>>;
	canCreateNewOption?: boolean;
	newOptionLabel?: string;
	extensions?: string[];
}> = ({
	options,
	path,
	filesHeading,
	noFilesHeading,
	selectedOpt,
	setSelectedOpt,
	customUri,
	setCustomUri,
	canCreateNewOption,
	newOptionLabel,
	extensions,
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const stylePath = useMemo(
		() => (path.startsWith('/') ? theme.fonts.bodySmall : undefined),
		[path, theme]
	);

	return (
		<View style={styles.optionsByPathWrapper}>
			{options.length === 0 && <Text>{noFilesHeading || ''}:</Text>}
			{options.length > 0 && path.startsWith('/') && <Text>{filesHeading || ''}:</Text>}
			<Text style={stylePath}>{path}</Text>
			{[...options].map((option) => (
				<Option
					key={option.key}
					option={option}
					selectedOpt={selectedOpt}
					setSelectedOpt={setSelectedOpt}
					customUri={customUri}
					setCustomUri={setCustomUri}
				/>
			))}

			{canCreateNewOption && (
				<CreateNewOption
					path={path}
					selectedOpt={selectedOpt}
					setSelectedOpt={setSelectedOpt}
					customUri={customUri}
					setCustomUri={setCustomUri}
					extensions={extensions}
					newOptionLabel={newOptionLabel}
				/>
			)}
		</View>
	);
};

const FileSourceRowControl: FC<{
	filePattern?: RegExp;
	extensions?: string[];
	dirs?: AbsPath[];
	value?: string;
	onSelect?: (newValue?: string | undefined) => void;
	onModalDismiss?: (newValue?: string | undefined) => void;
	label: string;
	header?: string;
	Info?: ReactNode | string;
	After?: ReactNode;
	filesHeading?: string;
	noFilesHeading?: string;
	dismissModalOnSelect?: boolean;
	canCreateNewOption?: boolean;
	hasCustom?: boolean;
	initialOptionsByPath?: OptionsByPathType;
	AlternativeButton?: AlternativeButtonType;
	styleContent?: ViewStyle;
	newOptionLabel?: string;
}> = ({
	filePattern,
	extensions,
	dirs,
	value,
	onSelect,
	onModalDismiss,
	label,
	header,
	Info,
	After,
	filesHeading,
	noFilesHeading,
	dismissModalOnSelect,
	canCreateNewOption,
	hasCustom,
	initialOptionsByPath = {},
	AlternativeButton = null,
	styleContent,
	newOptionLabel,
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const [modalVisible, setModalVisible] = useState(false);

	const handleOpenModal = useCallback(() => setModalVisible(true), []);

	const dirsInfos = useDirsInfo({
		navDirs: dirs || [],
		extensions,
		recursive: true,
	});

	const [optionsByPath, setOptionsByPath] = useState<OptionsByPathType>({});

	useEffect(() => {
		let newOptionsByPath = { ...initialOptionsByPath };
		if (dirsInfos) {
			Object.keys(dirsInfos).map((key) => {
				const dirInfo = dirsInfos[key];
				newOptionsByPath = {
					...newOptionsByPath,
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
			newOptionsByPath = {
				...newOptionsByPath,
				['']: [
					{
						key: 'custom',
						label: t('custom'),
					},
				],
			};
		}

		setOptionsByPath(newOptionsByPath);
	}, [
		dirsInfos,
		filePattern,
		hasCustom,
		t,
	]);

	const getInitialSelectedOpt = useCallback(() => {
		if (value) {
			const opt = Object.values(optionsByPath)
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
		optionsByPath,
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
	}, [optionsByPath, getInitialSelectedOpt]);

	const dismissModal = useCallback(() => {
		if (selectedOpt && onModalDismiss) {
			onModalDismiss(
				selectedOpt === 'custom' && undefined !== customUri ? customUri : selectedOpt
			);
		}
		setModalVisible(false);
	}, [
		selectedOpt,
		customUri,
		onModalDismiss,
	]);

	useEffect(() => {
		if (selectedOpt && onSelect) {
			onSelect(selectedOpt === 'custom' && undefined !== customUri ? customUri : selectedOpt);
		}
		if (selectedOpt && dismissModalOnSelect) {
			dismissModal();
		}
	}, [
		selectedOpt,
		customUri,
		dismissModal,
		dismissModalOnSelect,
		// onSelect,	// ??? should be dependency, but maybe it gets triggered on mount with this dep so it should be a ref
	]);

	const buttonLabel = useMemo(() => {
		if ('custom' === selectedOpt) {
			return getLabelFromUri(customUri);
		}
		if (!selectedOpt) {
			return 'selected.none';
		}

		let fallback = '';
		if (canCreateNewOption) {
			const selectedOptParts = selectedOpt.split('/');
			if (selectedOptParts.length > 0) {
				fallback = selectedOptParts[selectedOptParts.length - 1];
			}
		}

		return get(
			Object.values(optionsByPath)
				.flat()
				.find((opt) => opt.key === selectedOpt),
			'label',
			fallback
		);
	}, [selectedOpt]);

	return (
		<InfoRowControl
			label={label}
			Info={Info}
		>
			{/* {modalVisible && ( */}
			<ModalWrapper
				visible={modalVisible}
				backgroundBlur={false}
				onDismiss={dismissModal}
				header={header || label}
			>
				{Object.keys(optionsByPath).map((path) => (
					<OptionsByPath
						key={path}
						options={optionsByPath[path]}
						path={path}
						filesHeading={filesHeading}
						noFilesHeading={noFilesHeading}
						selectedOpt={selectedOpt}
						setSelectedOpt={setSelectedOpt}
						customUri={customUri}
						setCustomUri={setCustomUri}
						canCreateNewOption={canCreateNewOption}
						newOptionLabel={newOptionLabel}
						extensions={extensions}
					/>
				))}

				<ButtonHighlight
					style={styles.okButton}
					onPress={dismissModal}
					mode="contained"
					buttonColor={get(theme.colors, 'successContainer')}
					textColor={get(theme.colors, 'onSuccessContainer')}
				>
					<Text>{t('ok')}</Text>
				</ButtonHighlight>
			</ModalWrapper>
			{/* )} */}

			<View style={[styles.actionsRow, styleContent]}>
				{!AlternativeButton && dirsInfos && Object.keys(dirsInfos).length > 0 && (
					<ButtonHighlight
						style={styles.triggerButton}
						onPress={handleOpenModal}
					>
						<Text>{t(buttonLabel)}</Text>
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

const styles = StyleSheet.create({
	optionsByPathWrapper: { marginBottom: 18 },
	okButton: { marginTop: 10, marginBottom: 40 },
	actionsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '65%',
	},
	triggerButton: { marginTop: 3 },
});

export default FileSourceRowControl;
