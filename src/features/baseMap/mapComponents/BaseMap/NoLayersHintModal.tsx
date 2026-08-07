/**
 * External dependencies
 */
import { FC, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../../store/hooks';
import { setLayerTemp } from '../../slice';
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import useActivateDrawerItem from '../../../drawers/hooks/useActivateDrawerItem';
import { getNewLayer } from '../../utils';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';

const NoLayersHintModal: FC<{ layersLength: number }> = ({ layersLength }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { t } = useTranslation();
	const activateMapsDrawerItem = useActivateDrawerItem('maps');

	const [hintDismissed, setHintDismissed] = useState(false);
	const showNoLayersHint = layersLength === 0 && !hintDismissed;

	const handleDismissHint = useCallback(() => {
		setHintDismissed(true);
	}, []);

	const handleAddNewLayer = useCallback(() => {
		setHintDismissed(true);
		activateMapsDrawerItem();
		dispatch(setLayerTemp(getNewLayer()));
	}, [dispatch, activateMapsDrawerItem]);

	const buttonProps = useButtonProps({});

	return (
		<ModalWrapper
			visible={showNoLayersHint}
			onDismiss={handleDismissHint}
			headerLabel={t('baseMap.getStarted')}
			innerStyle={styles.modalInner}
		>
			<View>
				<ButtonHighlight
					{...buttonProps}
					onPress={handleAddNewLayer}
				>
					{t('baseMap.noLayersHintBody')}
				</ButtonHighlight>
			</View>

			<InfoLabelRow
				label={t('baseMap.note')}
				Info={t('baseMap.noteHint')}
			>
				<Text>
					{t('baseMap.noteBody')}
				</Text>
			</InfoLabelRow>
		</ModalWrapper>
	);
};

const styles = StyleSheet.create({
	modalInner: {
		gap: 8 * 8,
		marginTop: 8 * 4,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default NoLayersHintModal;
