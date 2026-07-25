/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { get } from 'lodash-es';
import { writeFile, ExternalStorageDirectoryPath } from 'react-native-fs';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import { ErrorToastContext } from '../../../../components/ErrorToast/Context';
import { logError } from '../../../../lib/utils';
import ensureStoragePermission from '../../../../lib/storagePermission';
import { LineEditModalContext } from './Context';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import RadioListItem from '../../../../components/generic/wrapper/RadioListItem';
import { sharedStyles } from './sharedDeps';
import { queryLineGeom } from '../../db/queryFns';
import { writeFormat, EXPORT_FORMATS, ExportFormat } from '../../utils/formatWriters';
import { resolveFilename, sanitizeFilename, DEFAULT_TEMPLATE } from '../../utils/filenameTemplate';

const EXPORT_DIR = ExternalStorageDirectoryPath + '/Android/media/com.jhotadhari.straymap/export';

const RowExport: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);

	const { line } = useContext(LineEditModalContext);

	const [modalVisible, setModalVisible] = useState(false);
	const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('gpx');
	const [writing, setWriting] = useState(false);

	const lineId = line?.id;
	const queryKey = useMemo(() => ['lineGeom', lineId] as (string | number)[], [lineId]);
	const { data: lineWithGeom, isError: geomError } = useQuery({
		queryKey,
		queryFn: queryLineGeom,
		enabled: typeof lineId === 'number' && modalVisible,
	});

	const handleOpenModal = useCallback(() => setModalVisible(true), []);
	const handleCloseModal = useCallback(() => {
		if (!writing) {
			setModalVisible(false);
		}
	}, [writing]);

	const handleWrite = useCallback(async () => {
		if (!lineWithGeom?.geometry) {
			showError(t('lines.exportNoGeom'));
			return;
		}
		setWriting(true);

		const hasPermission = await ensureStoragePermission();
		if (!hasPermission) {
			showError(t('lines.exportPermissionDenied'));
			setWriting(false);
			setModalVisible(false);
			return;
		}

		try {
			const safeTitle = line?.title ?? line?.id?.toString() ?? 'line';
			const dateStr = line?.created_at
				? dayjs(line.created_at).format('YYYY-MM-DD')
				: 'no-date';
			const ext = selectedFormat === 'geojson' ? 'geojson' : selectedFormat;

			const resolved = resolveFilename(DEFAULT_TEMPLATE, {
				title: safeTitle,
				id: line?.id,
				created_at: dateStr,
			});
			const filename = `${sanitizeFilename(resolved)}.${ext}`;

			const content = writeFormat(selectedFormat, [
				{
					geometry: lineWithGeom.geometry,
					meta: { title: line?.title, created_at: line?.created_at },
				},
			]);

			const path = `${EXPORT_DIR}/${filename}`;
			await writeFile(path, content, 'utf8');
		} catch (e) {
			logError('RowExport.writeFile', e);
			showError(t('errorGeneric'));
		} finally {
			setWriting(false);
			setModalVisible(false);
		}
	}, [
		lineWithGeom,
		line,
		selectedFormat,
		showError,
		t,
	]);

	const formatOptions = EXPORT_FORMATS.map((f) => ({
		key: f.key,
		label: f.label,
	}));

	return (
		<>
			{modalVisible && (
				<ModalWrapper
					visible={modalVisible}
					onDismiss={handleCloseModal}
					headerLabel={t('lines.export')}
				>
					{formatOptions.map((opt) => (
						<RadioListItem
							key={opt.key}
							opt={opt}
							onPress={() => setSelectedFormat(opt.key as ExportFormat)}
							status={selectedFormat === opt.key ? 'checked' : 'unchecked'}
							labelExtractor={(a) => a.label}
						/>
					))}

					<View style={styles.exportControls}>
						<ButtonHighlight
							onPress={handleWrite}
							mode="contained"
							disabled={writing || !lineWithGeom?.geometry}
							buttonColor={get(theme.colors, 'successContainer')}
							textColor={get(theme.colors, 'onSuccessContainer')}
						>
							<Text>{writing ? t('lines.exporting') : t('lines.export')}</Text>
						</ButtonHighlight>
					</View>

					{geomError && (
						<Text style={[styles.errorText, { color: theme.colors.error }]}>
							{t('errorGeneric')}
						</Text>
					)}
				</ModalWrapper>
			)}

			<InfoLabelRow
				label={t('lines.export')}
				Info={t('lines.hintExport')}
			>
				<ButtonHighlight
					mode="outlined"
					compact={true}
					onPress={handleOpenModal}
					icon="content-save-outline"
					contentStyle={sharedStyles.buttonContent}
					labelStyle={sharedStyles.buttonLabel}
					textColor={theme.colors.onBackground}
				>
					<View>
						<Text>{t('lines.export')}</Text>
					</View>
				</ButtonHighlight>
			</InfoLabelRow>
		</>
	);
};

const styles = StyleSheet.create({
	exportControls: { marginTop: 16, flexDirection: 'row', gap: 8 },
	errorText: { marginTop: 12 },
});

export default RowExport;
