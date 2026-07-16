/**
 * External dependencies
 */
import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../../components/generic/infoWrapper/InfoLabelRow';
import { MapsforgeProfile } from '../../../types';
import { OptionBase } from '../../../../../types';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { setMapsforgeProfileTemp } from '../../../slice';
import { selectMapsforgeProfileTemp, selectRenderStylesCache } from '../../../selectors';
import ListItemMenuControl from '../../../../../components/generic/wrapper/ListItemMenuControl';
import { sharedStyles } from '../../../../../sharedStyles';

const getDefaultSelectedOpt = (
	profile: MapsforgeProfile,
	opts: OptionBase[],
	defaultRenderStyle?: string
) => {
	let defaultSelected = undefined;
	if (profile.renderStyle) {
		defaultSelected = get(
			opts.find((opt) => opt.key === profile.renderStyle),
			'key'
		);
		if (defaultSelected) {
			return defaultSelected;
		}
	}
	return opts.length && defaultRenderStyle
		? get(
				opts.find((opt) => opt.key === defaultRenderStyle),
				'key'
			)
		: undefined;
};

const RenderStyleControl: FC<{
	Info?: ReactNode | string;
	AlternativeButton?: ReactNode;
}> = ({ Info, AlternativeButton }) => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const profileTemp = useAppSelector(selectMapsforgeProfileTemp);

	const renderStylesCache = useAppSelector(selectRenderStylesCache);

	const opts: OptionBase[] = useMemo(() => {
		const renderStyleOptions = get(renderStylesCache.optionsMap, profileTemp?.theme ?? '');
		if (renderStyleOptions) {
			return renderStyleOptions.map((opt) => ({ key: opt.value, label: opt.label }));
		}
		return [];
	}, [profileTemp?.theme, renderStylesCache]);

	const defaultRenderStyle = profileTemp?.theme
		? get(renderStylesCache.defaultsMap, profileTemp.theme)
		: undefined;

	const [selectedOpt, setSelectedOpt] = useState(
		profileTemp ? getDefaultSelectedOpt(profileTemp, opts, defaultRenderStyle) : undefined
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

	useEffect(() => {
		if (selectedOpt && profileTemp?.renderStyle !== selectedOpt) {
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
	}, [
		dispatch,
		selectedOpt,
		profileTemp?.renderStyle,
	]);

	if (!opts.length && !AlternativeButton) {
		return undefined;
	}

	return (
		<InfoLabelRow
			label={t('style')}
			Info={Info}
		>
			{!AlternativeButton && (
				<ListItemMenuControl
					listItemStyle={sharedStyles.listItem}
					options={opts}
					value={selectedOpt}
					setValue={(newValue) => {
						setSelectedOpt(newValue);
					}}
					anchorLabel={t(
						get(
							opts.find((opt) => opt.key === selectedOpt),
							'label',
							''
						)
					)}
				/>
			)}
			{AlternativeButton && AlternativeButton}
		</InfoLabelRow>
	);
};

export default RenderStyleControl;
