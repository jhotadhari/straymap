/**
 * External dependencies
 */
import { FC, Fragment, useContext, useMemo } from 'react';

/**
 * Internal dependencies
 */
import ButtonHighlightMenuControl from '../../../../components/generic/wrapper/ButtonHighlightMenuControl';
import useBulkActions from './useBulkActions';
import { FooterContext } from './Context';

const BulkActions: FC = () => {
	const { checkedIds } = useContext(FooterContext);

	const actions = useBulkActions();

	const actionList = useMemo(() => Object.values(actions), [actions]);

	return (
		<Fragment>
			{actionList.map((action) =>
				action?.modalNode ? (
					<Fragment key={action.key}>{action.modalNode}</Fragment>
				) : undefined
			)}

			<ButtonHighlightMenuControl
				options={actionList}
				anchorIcon="square-edit-outline"
				compact
				buttonPropsProps={{
					mode: 'text',
					disabled: !checkedIds.length,
				}}
			/>
		</Fragment>
	);
};

export default BulkActions;
