/**
 * External dependencies
 */
import { FC, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { setLayerTemp } from '../../slice';
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import useActivateDrawerItem from '../../../drawers/hooks/useActivateDrawerItem';
import { selectSideForKey } from '../../../drawers/selectors';
import { setUiItemKeys } from '../../../ui/slice';
import { getNewLayer } from '../../utils';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';

const NoLayersHintModal: FC<{ layersLength: number }> = ({ layersLength }) => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation();
	const activateMapsDrawerItem = useActivateDrawerItem('maps');
	const drawerSideWithMaps = useAppSelector((state) => selectSideForKey(state, 'maps'));

	const [hintDismissed, setHintDismissed] = useState(false);
	const showNoLayersHint = layersLength === 0 && !hintDismissed;

	const handleDismissHint = useCallback(() => {
		setHintDismissed(true);
	}, []);

	const handleAddNewLayer = useCallback(() => {
		setHintDismissed(true);
		if (drawerSideWithMaps) {
			activateMapsDrawerItem();
		} else {
			// The maps drawer item is not in any drawer — open the maps
			// settings page instead so the action isn't a silent no-op.
			dispatch(setUiItemKeys(['maps']));
		}
		dispatch(setLayerTemp(getNewLayer()));
	}, [
		dispatch,
		activateMapsDrawerItem,
		drawerSideWithMaps,
	]);

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
				<Text>{t('baseMap.noteBody')}</Text>
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
