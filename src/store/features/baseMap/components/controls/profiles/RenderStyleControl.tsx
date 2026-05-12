/**
 * External dependencies
 */
import {
	Dispatch,
	FC,
	ReactNode,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { ViewStyle, TextStyle, StyleSheet } from 'react-native';
import { useTheme, Text, Menu } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * react-native-mapsforge-vtm dependencies
 */
import { RenderStyleOptionsCollection } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import InfoRowControl from '../../../../../../components/generic/controls/InfoRowControl';
import ButtonHighlight from '../../../../../../components/generic/ButtonHighlight';
import MenuItem from '../../../../../../components/generic/MenuItem';
import { MapsforgeProfile } from '../../../types';
import { OptionBase } from '../../../../../../types';
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { setMapsforgeProfileTemp } from '../../../baseMapSlice';
import { selectMapsforgeProfileTemp, selectRenderStylesCache } from '../../../selectors';

const getDefaultSelectedOpt = (
	profile: MapsforgeProfile,
	opts: OptionBase[],
	defaultRenderStyle: string | null
) => {
	let defaultSelected = null;
	if (profile.renderStyle) {
		defaultSelected = get(
			opts.find((opt) => opt.key === profile.renderStyle),
			'key',
			null
		);
		if (defaultSelected) {
			return defaultSelected;
		}
	}
	return opts.length && defaultRenderStyle
		? get(
				opts.find((opt) => opt.key === defaultRenderStyle),
				'key',
				null
			)
		: null;
};

const RenderStyleControl = ({
	Info,
	AlternativeButton,
}: {
	Info?: ReactNode | string;
	AlternativeButton?: ReactNode;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const dispatch = useAppDispatch();

	const profileTemp = useAppSelector(selectMapsforgeProfileTemp);

	const renderStylesCache = useAppSelector(selectRenderStylesCache);

	const renderStyleOptions = profileTemp?.theme
		? renderStylesCache.optionsMap[profileTemp.theme]
		: null;

	const opts: OptionBase[] = useMemo(() => {
		if (profileTemp?.theme && renderStyleOptions) {
			return Object.keys(renderStyleOptions).map((key) => ({ key, label: key }));
		}
		return [];
	}, [profileTemp?.theme, renderStyleOptions]);

	const defaultRenderStyle = profileTemp?.theme
		? get(renderStylesCache.defaultsMap, profileTemp.theme, null)
		: null;

	const [selectedOpt, setSelectedOpt] = useState(
		profileTemp ? getDefaultSelectedOpt(profileTemp, opts, defaultRenderStyle) : null
	);
	useEffect(() => {
		if (
			profileTemp &&
			opts.length &&
			(null === selectedOpt || !opts.find((opt) => opt.key === selectedOpt))
		) {
			setSelectedOpt(getDefaultSelectedOpt(profileTemp, opts, defaultRenderStyle));
		}
	}, [
		profileTemp,
		opts,
		defaultRenderStyle,
		selectedOpt,
	]);

	const [menuVisible, setMenuVisible] = useState(false);

	useEffect(() => {
		if (selectedOpt) {
			dispatch(
				setMapsforgeProfileTemp(
					(profileTemp) =>
						({
							...(profileTemp ?? {}),
							renderStyle: selectedOpt,
							renderOverlays: [],
						}) as MapsforgeProfile
				)
			);
		}
	}, [selectedOpt]);

	const contentStyle = useMemo(
		() => ({
			borderColor: theme.colors.outline,
			borderWidth: 1,
		}),
		[theme]
	);

	const handleDismissMenu = useCallback(() => setMenuVisible(false), []);
	const handleOpenMenu = useCallback(() => setMenuVisible(true), []);

	return (
		<InfoRowControl
			label={t('style')}
			Info={Info}
		>
			{!AlternativeButton && (
				<Menu
					contentStyle={contentStyle}
					visible={menuVisible}
					onDismiss={handleDismissMenu}
					anchor={
						<ButtonHighlight
							style={styles.btn}
							onPress={handleOpenMenu}
						>
							<Text>
								{t(
									get(
										opts.find((opt) => opt.key === selectedOpt),
										'label',
										''
									)
								)}
							</Text>
						</ButtonHighlight>
					}
				>
					{[...opts].map((opt) => (
						<MenuItem
							key={opt.key}
							onPress={() => {
								setSelectedOpt(opt.key);
								handleDismissMenu();
							}}
							title={t(opt.label)}
							active={opt.key === selectedOpt}
						/>
					))}
				</Menu>
			)}

			{AlternativeButton && AlternativeButton}
		</InfoRowControl>
	);
};

const styles = StyleSheet.create({
	btn: { marginTop: 3 },
});

export default RenderStyleControl;
