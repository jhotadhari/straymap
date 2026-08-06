/**
 * External dependencies
 */
import { useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';
import { writeFile, ExternalStorageDirectoryPath } from 'react-native-fs';
import dayjs from '../../../../../lib/dayjs';
import { chunk } from 'lodash-es';
import { LineString } from 'geojson';

/**
 * Internal dependencies
 */
import { ErrorToastContext } from '../../../../../components/ErrorToast/Context';
import { logError } from '../../../../../lib/utils';
import ensureStoragePermission from '../../../../../lib/storagePermission';
import ButtonHighlight from '../../../../../components/generic/primitives/ButtonHighlight';
import ModalWrapper from '../../../../../components/generic/wrapper/ModalWrapper';
import RadioListItem from '../../../../../components/generic/wrapper/RadioListItem';
import { FooterContext } from '../Context';
import { fetchLines } from '../../../db/fetch';
import { writeFormat, EXPORT_FORMATS, ExportFormat } from '../../../utils/formatWriters';
import {
	resolveFilename,
	sanitizeFilename,
	DEFAULT_TEMPLATE,
} from '../../../utils/filenameTemplate';
import { LinePartial } from '../../../types';
import { useButtonProps } from '../../../../../compose/useButtonProps';

const EXPORT_DIR = ExternalStorageDirectoryPath + '/Android/media/com.jhotadhari.straymap/export';

const exportStyles = StyleSheet.create({
	exportControls: { marginTop: 16, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
});

const extractLabel = (a: { label: string }) => a.label;

const formatOptions = EXPORT_FORMATS.map((f) => ({
	key: f.key,
	label: f.label,
}));

const useExport = () => {
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

		const hasPermission = await ensureStoragePermission();
		if (!hasPermission) {
			showError(t('lines.exportPermissionDenied'));
			setWriting(false);
			setModalVisible(false);
			return;
		}

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
					'custom_date',
				],
			})) as (LinePartial & { geometry?: LineString })[];
			const prepTasks = linesWithGeom
				.filter((l) => l.geometry)
				.map((line) => {
					const safeTitle = line.title ?? line.id?.toString() ?? 'line';
					const rawDate = line.custom_date ?? line.created_at ?? null;
					const dateStr = rawDate
						? dayjs(rawDate).format('YYYY-MM-DD')
						: 'no-date';
					const ext = selectedFormat === 'geojson' ? 'geojson' : selectedFormat;

					const resolved = resolveFilename(DEFAULT_TEMPLATE, {
						title: safeTitle,
						id: line.id,
						custom_date: dateStr,
					});
					const filename = `${sanitizeFilename(resolved)}.${ext}`;

					const content = writeFormat(selectedFormat, [
						{
							geometry: line.geometry!,
							meta: {
								title: line.title,
								custom_date: rawDate,
							},
						},
					]);

					return { filename, content };
				});

			const total = prepTasks.length;

			const batchSize = 20;
			const batches = chunk(prepTasks, batchSize);

			for (const batch of batches) {
				const results = await Promise.allSettled(
					batch.map(({ filename, content }) =>
						writeFile(`${EXPORT_DIR}/${filename}`, content, 'utf8')
					)
				);
				results.forEach((result, i) => {
					if (result.status === 'fulfilled') {
						written++;
					} else {
						logError('useExport.handleExport.perFile', result.reason);
						failed.push(batch[i].filename);
					}
				});
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

	const buttonProps = useButtonProps({
		disabled: writing || !checkedIds.length,
	});

	const modalNode = useMemo(
		() =>
			modalVisible ? (
				<ModalWrapper
					key="export"
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
							labelExtractor={extractLabel}
						/>
					))}

					<View style={exportStyles.exportControls}>
						<ButtonHighlight
							{...buttonProps}
							onPress={handleExport}
						>
							{writing ? t('lines.exporting') : t('lines.export')}
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
			buttonProps,
			t,
		]
	);

	return useMemo(
		() => ({
			key: 'export',
			cb: handleOpenModal,
			label: 'lines.export',
			leadingIcon: 'content-save-outline',
			modalNode,
		}),
		[handleOpenModal, modalNode]
	);
};

export default useExport;
