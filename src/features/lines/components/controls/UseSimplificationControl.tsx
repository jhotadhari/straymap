/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ListItemMenuControl from '../../../../components/generic/wrapper/ListItemMenuControl';
import IconFontGis from '../../../../components/generic/primitives/IconFontGis';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectUseSimplification } from '../../selectors';
import { setUseSimplification } from '../../slice';

const UseSimplificationControl: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const useSimplification = useAppSelector(selectUseSimplification);
	const handleChange = useCallback(
		(newMode: string) => dispatch(setUseSimplification(newMode === 'simplify')),
		[dispatch]
	);

	const options = useMemo(
		() => [
			{ key: 'nosimplify', label: t('lines.useSimplificationDisabled') },
			{ key: 'simplify', label: t('lines.useSimplificationEnabled') },
		],
		[]
	);

	return (
		<ListItemMenuControl
			anchorLabel={t('lines.useSimplification')}
			options={options}
			setValue={handleChange}
			anchorLabelAppendSelected={true}
			value={useSimplification ? 'simplify' : 'nosimplify'}
			anchorIcon={({ color }) => (
				<IconFontGis
					name="simplify"
					color={color}
					size={25}
				/>
			)}
		/>
	);
};

export default UseSimplificationControl;
