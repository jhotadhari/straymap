/**
 * External dependencies
 */
import { ReactNode, useCallback, useState } from 'react';
import { IconButtonProps } from 'react-native-paper';

/**
 * Internal dependencies
 */
import IconButtonHighlight from '../primitives/IconButtonHighlight';
import InfoWrapper from './InfoWrapper';

const InfoButton = ({
	label,
	labelPattern,
	Info,
	Below,
	backgroundBlur = false,
	headerPlural = false,
	buttonProps,
}: {
	label?: string;
	labelPattern?: string;
	Info?: ReactNode | string;
	Below?: ReactNode;
	backgroundBlur?: boolean;
	headerPlural?: boolean;
	buttonProps: IconButtonProps;
}) => {
	const [modalVisible, setModalVisible] = useState(false);

	const handlePress = useCallback(() => setModalVisible(true), []);

	return buttonProps.icon ? (
		<InfoWrapper
			label={label}
			labelPattern={labelPattern}
			Info={Info}
			Below={Below}
			backgroundBlur={backgroundBlur}
			headerPlural={headerPlural}
			modalVisible={modalVisible}
			setModalVisible={setModalVisible}
		>
			<IconButtonHighlight
				{...buttonProps}
				onPress={handlePress}
			/>
		</InfoWrapper>
	) : null;
};

export default InfoButton;
