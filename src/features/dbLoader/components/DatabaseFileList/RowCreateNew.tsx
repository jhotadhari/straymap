/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../../store/hooks';
import { setDbPath } from '../../slice';
import { dbExtension } from '../../constants';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { styles } from './sharedDeps';
import { sharedStyles } from '../../../../sharedStyles';
import IconButtonHighlight from '../../../../components/generic/primitives/IconButtonHighlight';
import { getDbDefaultName } from '../../utils';
import { useButtonProps } from '../../../../compose/useButtonProps';

const RowCreateNew: FC<{
	dir: string;
	onCreated: () => void;
}> = ({ dir, onCreated }) => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const [expanded, setExpanded] = useState(false);
	const [nameInput, setNameInput] = useState('');

	const defaultName = useMemo(() => getDbDefaultName(), []);

	const handleExpand = useCallback(() => {
		setNameInput(defaultName);
		setExpanded(true);
	}, [defaultName]);

	const handleConfirm = useCallback(() => {
		const trimmed = nameInput.trim().toLowerCase();
		if (!trimmed) return;
		const newPath = `${dir}/${trimmed}.${dbExtension}`;
		dispatch(setDbPath(newPath));
		setExpanded(false);
		onCreated();
	}, [
		nameInput,
		dir,
		dispatch,
		onCreated,
	]);

	const buttonPropsAnchor = useButtonProps({});

	const buttonPropsCancel = useButtonProps({
		mode: 'text',
	});

	return (
		<View style={styles.createNewRow}>
			{!expanded && (
				<View style={sharedStyles.flexRow}>
					<ButtonHighlight
						{...buttonPropsAnchor}
						onPress={handleExpand}
					>
						{t('dbLoader.createNewDatabase')}
					</ButtonHighlight>
				</View>
			)}

			{expanded && (
				<View style={styles.createNewExpanded}>
					<TextInput
						value={nameInput}
						onChangeText={(v) => setNameInput(v.toLowerCase())}
						mode="outlined"
						dense
						style={styles.createNewInput}
						autoFocus
					/>
					<View style={styles.createNewActions}>
						<ButtonHighlight
							{...buttonPropsCancel}
							onPress={() => setExpanded(false)}
							compact
						>
							{t('cancel')}
						</ButtonHighlight>

						<IconButtonHighlight
							icon="check"
							mode="outlined"
							size={20}
							onPress={handleConfirm}
							disabled={!nameInput.trim()}
						/>
					</View>
				</View>
			)}
		</View>
	);
};

export default RowCreateNew;
