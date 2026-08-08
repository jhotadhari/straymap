/**
 * External dependencies
 */
import { FC, Fragment, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import {
	DRAWER_HANDLE_SIZE,
	DRAWER_ICON_SIZE as handleIconSize,
	itemStyles,
} from '../../../drawers/constants';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import DrawerContext from '../../../drawers/DrawerContext';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { addUiItemKey } from '../../../ui/slice';
import { selectSelected } from '../../selectors';
import useActions from './useActions';
import LinesActionsButton from './LinesActionsButton';

const styles = StyleSheet.create({
	item: {
		top: -(DRAWER_HANDLE_SIZE - handleIconSize) / 6,
	},
	flexRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		height: DRAWER_HANDLE_SIZE,
	},
	buttonRowReverse: {
		flexDirection: 'row-reverse',
	},
	childMeasure: {
		flexShrink: 0,
	},
});

const styleItem = [
	itemStyles.item,
	styles.item,
];

const DrawerTopBar: FC = () => {
	const { t } = useTranslation();

	const [contentFits, setContentFits] = useState(true);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { nestedIconColor, ...buttonProps }: ReturnType<typeof useButtonProps> =
		useButtonProps({
			mode: 'outlined',
			paddingHorizontal: contentFits,
		});

	const dispatch = useAppDispatch();

	const { side } = useContext(DrawerContext);

	const rowWidthRef = useRef(0);
	const browserBtnWidthRef = useRef(0);
	const actionsBtnWidthRef = useRef(0);

	const checkFit = useCallback(() => {
		if (!contentFits) return;
		if (rowWidthRef.current <= 0) return;
		const total = browserBtnWidthRef.current + actionsBtnWidthRef.current;
		if (total > rowWidthRef.current) {
			setContentFits(false);
		}
	}, [contentFits]);

	const handleRowLayout = useCallback(
		(e: LayoutChangeEvent) => {
			rowWidthRef.current = e.nativeEvent.layout.width;
			checkFit();
		},
		[checkFit]
	);

	const handleBrowserBtnLayout = useCallback(
		(e: LayoutChangeEvent) => {
			browserBtnWidthRef.current = e.nativeEvent.layout.width;
			checkFit();
		},
		[checkFit]
	);

	const handleActionsBtnLayout = useCallback(
		(e: LayoutChangeEvent) => {
			actionsBtnWidthRef.current = e.nativeEvent.layout.width;
			checkFit();
		},
		[checkFit]
	);

	const openLinesBrowser = useCallback(
		() => dispatch(addUiItemKey('linesBrowser')),
		[
			dispatch,
		]
	);

	const lineIds = useAppSelector(selectSelected);

	const actions = useActions({ lineIds });

	const styleButtonRowFirst = useMemo(
		() => [
			itemStyles.buttonRow,
			styles.flexRow,
			'left' === side && styles.buttonRowReverse,
		],
		[side]
	);

	const actionModalNodes = useMemo(
		() =>
			Object.entries(actions)
				.filter(([, a]) => a.modalNode)
				.map(([key, a]) => <Fragment key={key}>{a.modalNode}</Fragment>),
		[actions]
	);

	return (
		<View>
			{actionModalNodes}

			<View style={styleItem}>
				<View style={styleButtonRowFirst} onLayout={handleRowLayout}>
					{lineIds.length > 0 && (
						<View
							style={styles.childMeasure}
							onLayout={handleActionsBtnLayout}
						>
							<LinesActionsButton
								actions={actions}
								label={sprintf(t('lines.linesCount'), lineIds.length)}
								buttonProps={buttonProps}
							/>
						</View>
					)}

					{lineIds.length === 0 && <Text>{t('lines.noLinesSelected')}</Text>}

					<View
						style={styles.childMeasure}
						onLayout={handleBrowserBtnLayout}
					>
						<ButtonHighlight
							{...buttonProps}
							onPress={openLinesBrowser}
							compact
						>
							{t('lines.linesBrowser')}
						</ButtonHighlight>
					</View>
				</View>
			</View>

		</View>
	);
};

export default DrawerTopBar;
