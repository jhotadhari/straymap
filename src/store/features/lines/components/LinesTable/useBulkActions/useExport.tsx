/**
 * External dependencies
 */
import { useCallback, useContext, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';
import { writeFile, ExternalStorageDirectoryPath } from 'react-native-fs';
import { get } from 'lodash-es';
import dayjs from 'dayjs';
import { LineString } from 'geojson';

/**
 * Internal dependencies
 */
import { ErrorToastContext } from '../../../../../../components/ErrorToast/Context';
import { logError } from '../../../../../../lib/utils';
import ButtonHighlight from '../../../../../../components/generic/ButtonHighlight';
import ModalWrapper from '../../../../../../components/generic/ModalWrapper';
import RadioListItem from '../../../../../../components/generic/RadioListItem';
import { FooterContext } from '../Context';
import { fetchLines } from '../../../db/fetch';
import { writeFormat, EXPORT_FORMATS, ExportFormat } from '../../../utils/formatWriters';
import {
	resolveFilename,
	sanitizeFilename,
	DEFAULT_TEMPLATE,
} from '../../../utils/filenameTemplate';
import { LinePartial } from '../../../types';

const EXPORT_DIR = ExternalStorageDirectoryPath + '/Android/media/com.jhotadhari.straymap/export';

const formatOptions = EXPORT_FORMATS.map((f) => ({
	key: f.key,
	label: f.label,
}));

const useExport = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);

	const { checkedIds } = useContext(FooterContext);

	const [modalVisible, setModalVisible] = useState(false);
	const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('gpx');
	const [writing, setWriting] = useState(false);

	const handleOpenModal = useCallback(() => setModalVisible(true), []);
	const handleCloseModal = useCallback(() => {
		if (!writing) {
			setModalVisible(false);
		}
	}, [writing]);

	const handleExport = useCallback(async () => {
		if (!checkedIds.length) {
			return;
		}
		setWriting(true);

		let written = 0;
		const failed: string[] = [];

		try {
			// Fetch geometry for all checked lines in one query
			const linesWithGeom = (await fetchLines({
				lineIds: checkedIds,
				fieldsInclude: [
					'geometry',
					'title',
					'created_at',
				],
			})) as (LinePartial & { geometry?: LineString })[];
			const total = linesWithGeom.filter((l) => l.geometry).length;

			for (const line of linesWithGeom) {
				if (!line.geometry) {
					continue;
				}

				const safeTitle = line.title ?? line.id?.toString() ?? 'line';
				const dateStr = line.created_at
					? dayjs(line.created_at).format('YYYY-MM-DD')
					: 'no-date';
				const ext = selectedFormat === 'geojson' ? 'geojson' : selectedFormat;

				const resolved = resolveFilename(DEFAULT_TEMPLATE, {
					title: safeTitle,
					id: line.id,
					created_at: dateStr,
				});
				const filename = `${sanitizeFilename(resolved)}.${ext}`;

				const content = writeFormat(selectedFormat, [
					{
						geometry: line.geometry,
						meta: {
							title: line.title,
							created_at: line.created_at,
						},
					},
				]);

				try {
					const path = `${EXPORT_DIR}/${filename}`;
					await writeFile(path, content, 'utf8');
					written++;
				} catch (e) {
					logError('useExport.handleExport.perFile', e);
					failed.push(filename);
				}
			}

			// Report outcome
			if (written === 0 && total === 0) {
				showError(t('lines.exportNoGeom'));
			} else if (written === 0) {
				showError(t('lines.exportNoFilesWritten'));
			} else if (failed.length) {
				showError(sprintf(t('lines.exportPartial'), written, total, failed.join(', ')));
			}
		} catch (e) {
			logError('useExport.handleExport', e);
			if (written > 0) {
				showError(
					sprintf(
						t('lines.exportPartial'),
						written,
						written + failed.length,
						failed.join(', ')
					)
				);
			} else {
				showError(t('errorGeneric'));
			}
		} finally {
			setWriting(false);
			setModalVisible(false);
		}
	}, [
		checkedIds,
		selectedFormat,
		showError,
		t,
	]);

	const disabled = writing || !checkedIds.length;

	const modalNode = useMemo(
		() =>
			modalVisible ? (
				<ModalWrapper
					key="export"
					visible={modalVisible}
					onDismiss={handleCloseModal}
					header={t('lines.export')}
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

					<View
						style={{
							marginTop: 16,
							flexDirection: 'row',
							gap: 8,
						}}
					>
						<ButtonHighlight
							onPress={handleExport}
							mode="contained"
							disabled={disabled}
							buttonColor={get(theme.colors, 'successContainer')}
							textColor={get(theme.colors, 'onSuccessContainer')}
						>
							<Text>{writing ? t('lines.exporting') : t('lines.export')}</Text>
						</ButtonHighlight>
					</View>
				</ModalWrapper>
			) : undefined,
		[
			modalVisible,
			handleCloseModal,
			handleExport,
			selectedFormat,
			writing,
			disabled,
			t,
			theme,
		]
	);

	return useMemo(
		() => ({
			key: 'export',
			cb: handleOpenModal,
			label: t('lines.export'),
			leadingIcon: 'content-save-outline',
			modalNode,
		}),
		[
			handleOpenModal,
			t,
			modalNode,
		]
	);
};

export default useExport;
