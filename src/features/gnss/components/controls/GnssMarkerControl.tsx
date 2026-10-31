/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo } from 'react';
import { Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import MarkerControl from '../../../../components/generic/controls/MarkerControl';
import NumericRowControl from '../../../../components/generic/controls/NumericRowControl';
import OptionMenuRowControl from '../../../../components/generic/controls/OptionMenuRowControl';
import ToggleRowControl from '../../../../components/generic/controls/ToggleRowControl';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
	selectAccuracyCircleThresholdMeters,
	selectMarkerColor,
	selectMarkerDirection,
	selectMarkerIconSource,
	selectMarkerSize,
	selectShowMeasurementLabel,
} from '../../selectors';
import {
	setAccuracyCircleThresholdMeters,
	setMarkerColor,
	setMarkerDirection,
	setMarkerIconSource,
	setMarkerSize,
	setShowMeasurementLabel,
	initialSettings,
	GnssMarkerDirection,
} from '../../slice';
import { buildMarkerSvg } from '../../markerSvg';
import { selectAppDirs } from '../../../dirs/selectors';
import { selectUnitPrefs } from '../../../general/selectors';
import { metersToUnit, unitToMeters, formatDistanceUnit } from '../../../../lib/formatting';
import { roundTo } from '../../../../lib/utilsLight';
import { OptionBase } from '../../../../types';
import { EMPTY_STRING_ARRAY } from '../../../../constants';

const GNSS_MARKER_ICON_EXTENSIONS = ['svg', 'png'];

const initialOptionsByPath = {
	[' ']: [
		{
			key: 'triangle',
			label: 'gnss.markerIconTriangle',
		},
	],
};

const markerDirectionOptions: OptionBase[] = [
	{
		key: 'movingDirection',
		label: 'gnss.markerDirectionMode.movingDirection',
	},
	{
		key: 'north',
		label: 'gnss.markerDirectionMode.magneticNorth',
	},
];

const validateAccuracyThreshold = (val: number) => val >= 0;

const isFileSource = (iconSource: string) =>
	iconSource.startsWith('/') || iconSource.startsWith('content://');

/** Live preview of the configured marker (preset triangle or custom file). */
const GnssMarkerPreview: FC<{
	config: { iconSource: string; size: number; color: string };
}> = ({ config }) => {
	if (!config.iconSource) {
		return null;
	}
	if (isFileSource(config.iconSource)) {
		return (
			<Icon
				source="file-image-outline"
				color={config.color}
				size={config.size}
			/>
		);
	}
	return (
		<SvgXml
			xml={buildMarkerSvg(config.size, config.color)}
			width={config.size}
			height={config.size}
		/>
	);
};

/**
 * GNSS position-marker config control — same modal pattern as the cursor
 * control, with the triangle preset / custom svg+png files, the accuracy
 * circle threshold and the measurement-label visibility toggle.
 */
const GnssMarkerControl: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const appDirs = useAppSelector(selectAppDirs);
	const markerIconSource = useAppSelector(selectMarkerIconSource);
	const markerSize = useAppSelector(selectMarkerSize);
	const markerColor = useAppSelector(selectMarkerColor);
	const markerDirection = useAppSelector(selectMarkerDirection);
	const accuracyCircleThresholdMeters = useAppSelector(selectAccuracyCircleThresholdMeters);
	const showMeasurementLabel = useAppSelector(selectShowMeasurementLabel);
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const distanceUnitPref = unitPrefs?.distance;
	const accuracyUnit = formatDistanceUnit(distanceUnitPref, true);

	// The threshold is stored in meters but shown in the user's distance
	// unit (metric → m, imperial → ft, nautical → nm).
	const accuracyThresholdDisplay = useMemo(
		() =>
			roundTo(
				metersToUnit(accuracyCircleThresholdMeters, distanceUnitPref, true),
				distanceUnitPref.round
			),
		[accuracyCircleThresholdMeters, distanceUnitPref]
	);

	const config = useMemo(
		() => ({
			iconSource: markerIconSource,
			size: markerSize,
			color: markerColor,
		}),
		[
			markerIconSource,
			markerSize,
			markerColor,
		]
	);

	const handleUpdate = useCallback(
		(partial: Partial<{ iconSource: string; size: number; color: string }>) => {
			if (partial.iconSource !== undefined) {
				dispatch(setMarkerIconSource(partial.iconSource));
			}
			if (partial.size !== undefined) {
				dispatch(setMarkerSize(partial.size));
			}
			if (partial.color !== undefined) {
				dispatch(setMarkerColor(partial.color));
			}
		},
		[dispatch]
	);

	const extraRows = (
		<>
			<OptionMenuRowControl
				label={t('gnss.markerDirection')}
				Info={t('gnss.hintMarkerDirection')}
				options={markerDirectionOptions}
				value={markerDirection}
				onUpdate={(val: string) => dispatch(setMarkerDirection(val as GnssMarkerDirection))}
			/>

			<NumericRowControl
				label={t('gnss.accuracyCircle', { unit: accuracyUnit })}
				value={accuracyThresholdDisplay}
				onUpdate={(val: number) =>
					dispatch(setAccuracyCircleThresholdMeters(unitToMeters(val, distanceUnitPref, true)))
				}
				validate={validateAccuracyThreshold}
				numType="float"
				Info={t('gnss.hintAccuracyCircle')}
			/>

			<ToggleRowControl
				label={t('gnss.showMeasurementLabel')}
				value={showMeasurementLabel}
				onToggle={() => dispatch(setShowMeasurementLabel(!showMeasurementLabel))}
				Info={t('gnss.hintShowMeasurementLabel')}
			/>
		</>
	);

	return (
		<MarkerControl
			anchorLabel={t('gnss.gnssMarker')}
			header={t('gnss.gnssMarker')}
			config={config}
			onUpdate={handleUpdate}
			defaultIconSource={initialSettings.markerIconSource}
			initialOptionsByPath={initialOptionsByPath}
			extensions={GNSS_MARKER_ICON_EXTENSIONS}
			dirs={appDirs?.marker ?? EMPTY_STRING_ARRAY}
			PreviewComponent={GnssMarkerPreview}
			hintFile={t('gnss.hintMarkerFile')}
			hintSize={t('gnss.hintMarkerSize')}
			hintColor={t('gnss.hintMarkerColor')}
			hintPreview={t('gnss.hintMarkerPreview')}
			fileRowHeader={t('selectFile')}
			fileRowLabel={t('file')}
			filesHeading={sprintf(t('filesIn'), '(svg|png)')}
			noFilesHeading={sprintf(t('noFilesIn'), '(svg|png)')}
			sizeLabel={t('sizePx')}
			colorLabel={t('appearance.color')}
			previewLabel={t('appearance.preview')}
			extraRows={extraRows}
		/>
	);
};

export default GnssMarkerControl;
