/**
 * External dependencies
 */
import { FC, Fragment, useContext, useMemo } from 'react';

/**
 * Internal dependencies
 */
import ButtonHighlightMenuControl from '../../../../components/generic/wrapper/ButtonHighlightMenuControl';
import useTagBulkActions from './useBulkActions';
import { FooterContext } from './Context';

const TagBulkActions: FC = () => {
	const { checkedIds } = useContext(FooterContext);

	const actions = useTagBulkActions();

	const actionList = useMemo(() => Object.values(actions), [actions]);

	const buttonPropsProps = useMemo(
		() => ({
			mode: 'text' as const,
			disabled: !checkedIds.length,
		}),
		[checkedIds.length]
	);

	return (
		<Fragment>
			{actionList.map((action) =>
				action?.modalNode ? (
					<Fragment key={action.key}>{action.modalNode}</Fragment>
				) : undefined
			)}

			<ButtonHighlightMenuControl
				options={actionList}
				anchorIconNested="square-edit-outline"
				compact
				buttonPropsProps={buttonPropsProps}
			/>
		</Fragment>
	);
};

export default TagBulkActions;
