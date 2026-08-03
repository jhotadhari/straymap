/**
 * External dependencies
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import dayjs from '../../../../lib/dayjs';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import ListItemModalControl from '../../../../components/generic/wrapper/ListItemModalControl';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ToggleRowControl from '../../../../components/generic/controls/ToggleRowControl';
import HintLink from '../../../../components/generic/primitives/HintLink';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectDateTimeFormat } from '../../selectors';
import { setDateTimeFormat, DEFAULT_DATE_TIME_FORMAT } from '../../slice';
import { sharedStyles } from '../../../../sharedStyles';

const AnchorClockIcon = ({ color, style }: { color: string; style: any }) => (
	<View style={style}>
		<Icon
			source="clock-outline"
			color={color}
			size={25}
		/>
	</View>
);

const DateTimeControl = () => {
	const { t, i18n } = useTranslation();
	const theme = useTheme();

	const dispatch = useAppDispatch();
	const dateTimeFormat = useAppSelector(selectDateTimeFormat);

	const [isCustomActive, setIsCustomActive] = useState(
		dateTimeFormat !== DEFAULT_DATE_TIME_FORMAT
	);
	const [val, setVal] = useState(
		dateTimeFormat !== DEFAULT_DATE_TIME_FORMAT ? dateTimeFormat : DEFAULT_DATE_TIME_FORMAT
	);

	useEffect(() => {
		if (!isCustomActive) {
			setVal(DEFAULT_DATE_TIME_FORMAT);
		}
	}, [dateTimeFormat, isCustomActive]);

	const valRef = useRef(val);
	valRef.current = val;

	const handleToggleCustom = useCallback(() => {
		if (isCustomActive) {
			dispatch(setDateTimeFormat(DEFAULT_DATE_TIME_FORMAT));
			setIsCustomActive(false);
			setVal(DEFAULT_DATE_TIME_FORMAT);
		} else {
			setIsCustomActive(true);
			setVal(DEFAULT_DATE_TIME_FORMAT);
		}
	}, [isCustomActive, dispatch]);

	const handleChangeText = useCallback((newVal: string) => {
		setVal(newVal);
		valRef.current = newVal;
	}, []);

	const handleBlur = useCallback(() => {
		if (!isCustomActive) return;
		if (!valRef.current) {
			dispatch(setDateTimeFormat(DEFAULT_DATE_TIME_FORMAT));
			setIsCustomActive(false);
			setVal(DEFAULT_DATE_TIME_FORMAT);
			return;
		}
		if (valRef.current !== dateTimeFormat) {
			dispatch(setDateTimeFormat(valRef.current));
		}
	}, [
		isCustomActive,
		dateTimeFormat,
		dispatch,
	]);

	const handleFocus = useCallback(() => {
		if (!isCustomActive) {
			setIsCustomActive(true);
			setVal(DEFAULT_DATE_TIME_FORMAT);
		}
	}, [isCustomActive]);

	const dayJsUrl = useMemo(
		() =>
			i18n.language === 'es'
				? 'https://day.js.org/docs/es-ES/display/format'
				: 'https://day.js.org/docs/en/display/format',
		[i18n.language]
	);

	const hintFormatDefault = useMemo(
		() => (
			<View style={sharedStyles.gap}>
				<Text>
					{sprintf(t('general.hint.dateTimeHintDefault'), DEFAULT_DATE_TIME_FORMAT)}
				</Text>

				<Text>{t('general.hint.dateTimeFormat')}</Text>
				<HintLink
					label={t('general.formatDocs') + ':'}
					url={dayJsUrl}
				/>
			</View>
		),
		[t, dayJsUrl]
	);

	const hintFormatCustom = useMemo(
		() => (
			<View style={sharedStyles.gap}>
				<Text>{t('general.hint.dateTimeHintCustom')}</Text>

				<Text>{t('general.hint.dateTimeFormat')}</Text>
				<HintLink
					label={t('general.formatDocs') + ':'}
					url={dayJsUrl}
				/>
			</View>
		),
		[t, dayJsUrl]
	);

	const overwriteTheme = useMemo(
		() => ({
			fonts: {
				bodyLarge: {
					...theme.fonts.bodySmall,
					fontFamily: 'sans-serif',
				},
			},
		}),
		[theme]
	);

	const styleInput = useMemo(
		() => [
			localStyles.input,
			!isCustomActive && sharedStyles.disabled,
		],
		[isCustomActive]
	);

	const formatPreview = useMemo(() => {
		const fmt = isCustomActive ? val : DEFAULT_DATE_TIME_FORMAT;
		const now = dayjs();
		if (now.isValid()) {
			return now.format(fmt);
		}
		return '';
	}, [isCustomActive, val]);

	return (
		<ListItemModalControl
			anchorLabel={t('general.dateTime')}
			anchorIcon={AnchorClockIcon}
			header={t('general.dateTime')}
		>
			<View style={[localStyles.gap, localStyles.itemsStart]}>
				<View style={localStyles.noticeRow}>
					<Text>{t('general.timeZoneNotice')}</Text>
				</View>

				<ToggleRowControl
					label={t('general.useDefaultFormat')}
					value={!isCustomActive}
					onToggle={handleToggleCustom}
					innerStyle={sharedStyles.alignStart}
					Info={hintFormatDefault}
				/>

				<InfoLabelRow
					label={t('general.customFormat')}
					Info={hintFormatCustom}
				>
					<TextInput
						style={styleInput}
						underlineColor="transparent"
						dense={true}
						theme={overwriteTheme}
						onChangeText={handleChangeText}
						onBlur={handleBlur}
						onFocus={handleFocus}
						value={val}
					/>
				</InfoLabelRow>

				<InfoLabelRow label={t('general.example')}>
					<Text>{formatPreview}</Text>
				</InfoLabelRow>
			</View>
		</ListItemModalControl>
	);
};

const localStyles = StyleSheet.create({
	gap: {
		gap: 16,
	},
	itemsStart: {
		alignItems: 'flex-start',
	},
	input: {
		flexGrow: 1,
	},
	noticeRow: {
		marginBottom: 16,
	},
});

export default memo(DateTimeControl);
