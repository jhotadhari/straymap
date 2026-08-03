/**
 * External dependencies
 */
import { FC, memo, ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { View, ViewStyle } from 'react-native';
import { Icon, PaperProvider, useTheme } from 'react-native-paper';
import { DatePickerModal, TimePickerModal } from 'react-native-paper-dates';
import dayjs from '../../../lib/dayjs';
import { resolveLocale } from '../../../assets/i18n/i18n';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../primitives/ButtonHighlight';
import InfoLabelRow from '../infoWrapper/InfoLabelRow';
import { useButtonProps } from '../../../compose/useButtonProps';
import { sharedStyles } from '../../../sharedStyles';

const DateTimePickerControl: FC<{
	value: Date | undefined;
	onUpdate: (date: Date) => void;
	format?: string;
	locale?: string;
	label?: string;
	labelNode?: ReactNode;
	Info?: ReactNode;
	style?: ViewStyle;
	anchor?: FC<{ onPress: () => void }>;
	onBeforeOpen?: () => void;
}> = ({
	value,
	onUpdate,
	format = 'YYYY-MM-DD HH:mm:ss',
	locale = 'en',
	label,
	labelNode,
	Info,
	style,
	anchor: Anchor,
	onBeforeOpen,
}) => {
	const theme = useTheme();

	const [datePickerVisible, setDatePickerVisible] = useState(false);
	const [timePickerVisible, setTimePickerVisible] = useState(false);

	const hasVisiblePicker = datePickerVisible || timePickerVisible;

	const customTheme = useMemo(
		() => ({
			...theme,
			colors: {
				...theme.colors,
				backdrop: theme.colors.background,
			},
		}),
		[theme]
	);

	const resolvedLocale = useMemo(() => resolveLocale(locale), [locale]);

	const pendingDateRef = useRef<Date | undefined>(undefined);

	const onUpdateRef = useRef(onUpdate);
	onUpdateRef.current = onUpdate;

	const onBeforeOpenRef = useRef(onBeforeOpen);
	onBeforeOpenRef.current = onBeforeOpen;

	const hours = useMemo(() => value?.getHours() ?? 0, [value]);
	const minutes = useMemo(() => value?.getMinutes() ?? 0, [value]);

	const formattedValue = useMemo(
		() => (value ? dayjs(value).format(format) : ''),
		[value, format]
	);

	const buttonProps = useButtonProps({
		style: {
			justifyContent: 'flex-start',
		},
	});

	const handlePress = useCallback(() => {
		onBeforeOpenRef.current?.();
		setDatePickerVisible(true);
	}, []);

	const handleDateConfirm = useCallback(({ date }: { date?: Date | undefined }) => {
		setDatePickerVisible(false);
		if (date) {
			pendingDateRef.current = date;
			setTimePickerVisible(true);
		}
	}, []);

	const handleDateDismiss = useCallback(() => {
		setDatePickerVisible(false);
	}, []);

	const handleTimeConfirm = useCallback(
		({ hours: h, minutes: m }: { hours: number; minutes: number }) => {
			setTimePickerVisible(false);
			const d = pendingDateRef.current;
			if (d) {
				const combined = new Date(d);
				combined.setHours(h);
				combined.setMinutes(m);
				combined.setSeconds(0);
				combined.setMilliseconds(0);
				onUpdateRef.current(combined);
			}
			pendingDateRef.current = undefined;
		},
		[]
	);

	const handleTimeDismiss = useCallback(() => {
		setTimePickerVisible(false);
		pendingDateRef.current = undefined;
	}, []);

	const icon = useCallback(
		(props: { size: number; color: string }) => (
			<Icon
				source={value ? 'calendar-clock' : 'calendar-clock-outline'}
				size={props.size}
				color={props.color}
			/>
		),
		[value]
	);

	const builtInTrigger = (
		<ButtonHighlight
			{...buttonProps}
			onPress={handlePress}
			icon={icon}
		>
			{formattedValue || ''}
		</ButtonHighlight>
	);

	const pickers = hasVisiblePicker ? (
		<PaperProvider theme={customTheme}>
			<DatePickerModal
				locale={resolvedLocale}
				mode="single"
				visible={datePickerVisible}
				onDismiss={handleDateDismiss}
				date={value}
				onConfirm={handleDateConfirm}
			/>

			<TimePickerModal
				visible={timePickerVisible}
				onDismiss={handleTimeDismiss}
				onConfirm={handleTimeConfirm}
				hours={hours}
				minutes={minutes}
				use24HourClock
				locale={resolvedLocale}
			/>
		</PaperProvider>
	) : null;

	if (Anchor) {
		return (
			<>
				<Anchor onPress={handlePress} />

				{pickers}
			</>
		);
	}

	return (
		<>
			{label || labelNode ? (
				<InfoLabelRow
					label={label}
					labelNode={labelNode}
					Info={Info}
					style={style}
				>
					<View style={sharedStyles.flex1}>{builtInTrigger}</View>
				</InfoLabelRow>
			) : (
				builtInTrigger
			)}

			{pickers}
		</>
	);
};

export default memo(DateTimePickerControl);
