/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction, useContext, useMemo, useState } from 'react';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ScrollView, TouchableHighlight, View } from 'react-native';
import formatcoords from 'formatcoords';
import { sprintf } from 'sprintf-js';
import DraggableGrid from 'react-native-draggable-grid';
import { get, omit } from 'lodash-es';
import { GetTrackParams } from 'react-native-brouter';
import { createDocument } from 'react-native-scoped-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/ModalWrapper';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import DrawerContext from '../../drawers/DrawerContext';
import { RoutingContext } from '../RoutingContext';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { setIsRouting } from '../routingSlice';
import { selectIsRouting, selectPoints, selectSegments } from '../selectors';

const DismissProceedModal: FC<{
	dismissModalVisible: boolean;
	setDismissModalVisible: Dispatch<SetStateAction<boolean>>;
}> = ({ dismissModalVisible, setDismissModalVisible }) => {
	const {
		savedExported,
		setMovingPointIdx,
	} = useContext(RoutingContext);

	const dispatch = useAppDispatch();

	const theme = useTheme();
	const { t } = useTranslation();

	const { expand } = useContext(DrawerContext);

	return (
		<ModalWrapper
			visible={dismissModalVisible}
			onDismiss={() => setDismissModalVisible(false)}
			onHeaderBackPress={() => setDismissModalVisible(false)}
			header={'sicher???'}
		>
			<View style={{ marginTop: 20 }}>
				<Text style={{ marginBottom: 20 }}>
					{'sicher das du routing abbrechen möchtest???'}
				</Text>
				{Object.keys(savedExported || {}).map((key) =>
					!get(savedExported, key) ? (
						<Text
							key={key}
							style={{ marginBottom: 20 }}
						>
							{sprintf('The route is not %s. ???', key)}
						</Text>
					) : null
				)}
			</View>

			<View
				style={{
					marginTop: 20,
					marginBottom: 40,
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<ButtonHighlight
					onPress={() => setDismissModalVisible(false)}
					mode="contained"
					buttonColor={get(theme.colors, 'successContainer')}
					textColor={get(theme.colors, 'onSuccessContainer')}
				>
					<Text>{t('continue???')}</Text>
				</ButtonHighlight>

				<ButtonHighlight
					onPress={() => {
						expand(false);
						setDismissModalVisible(false);
						setIsRouting && dispatch(setIsRouting(false));
						setMovingPointIdx && setMovingPointIdx(undefined);
					}}
					mode="contained"
					buttonColor={theme.colors.errorContainer}
					textColor={theme.colors.onErrorContainer}
				>
					<Text>{t('stopRouting???')}</Text>
				</ButtonHighlight>
			</View>
		</ModalWrapper>
	);
};

export default DismissProceedModal;
