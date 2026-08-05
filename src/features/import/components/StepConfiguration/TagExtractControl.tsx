/**
 * External dependencies
 */
import { FC, memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../../store/hooks';
import { selectTagMode, selectTagRegexes } from '../../selectors';
import { useImportContext } from '../ImportContext';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import TagExtractModal from './TagExtractModal';

const TagExtractControl: FC = () => {
	const { t } = useTranslation();
	const { selectedTagIds } = useImportContext();

	const tagMode = useAppSelector(selectTagMode);
	const tagRegexes = useAppSelector(selectTagRegexes);

	const buttonProps = useButtonProps({});

	const [modalVisible, setModalVisible] = useState(false);

	const handleOpenModal = useCallback(() => setModalVisible(true), []);

	const anchorLabel = useMemo(() => {
		if (tagMode === 'existing') {
			return sprintf(t('import.tagModeExistingLabel'), selectedTagIds.length);
		}
		if (tagMode === 'regex') {
			return sprintf(t('import.tagModeRegexLabel'), tagRegexes.length);
		}
		return t('import.tagModeNoneLabel');
	}, [tagMode, selectedTagIds.length, tagRegexes.length, t]);

	const handleDismiss = useCallback(() => {
		setModalVisible(false);
	}, []);

	return (
		<>
			<InfoLabelRow
				backgroundBlur={true}
				label={t('import.tagMode')}
				Info={t('import.hint.tagMode')}
			>
				<ButtonHighlight
					{...buttonProps}
					compact
					onPress={handleOpenModal}
				>
					{anchorLabel}
				</ButtonHighlight>
			</InfoLabelRow>

			<TagExtractModal visible={modalVisible} onDismiss={handleDismiss} />
		</>
	);
};

export default memo(TagExtractControl);
