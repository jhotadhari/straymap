/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import ListItemMenuControl from '../../../../../components/generic/controls/ListItemMenuControl';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectLang } from '../../selectors';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '../../../../../assets/i18n/constants';
import { setLang } from '../../generalSlice';
import { sortArrayByOrderArray } from '../../../../../lib/utilsGeneral';

const LangControl: FC = () => {
	const { t, i18n } = useTranslation();
	const dispatch = useAppDispatch();

	const lang = useAppSelector(selectLang);
	const handleChange = useCallback((newLang: string) => dispatch(setLang(newLang)), []);

	const options = useMemo(
		() => [
			{
				key: 'system',
				label: 'systemSetting',
			},
			...Object.keys(LANGUAGE_NAMES).map((langKey: string) => ({
				key: langKey,
				label: get(LANGUAGE_NAMES, [langKey, 'native'], ''),
			})),
		],
		[]
	);

	return (
		<ListItemMenuControl
			anchorLabel={(
				sortArrayByOrderArray([...SUPPORTED_LANGUAGES], [i18n.language]) as string[]
			)
				.map((l) => t('general.selectLang', { lng: l }))
				.reverse()
				.join(' / ')}
			anchorLabelAppendSelected={true}
			options={options}
			setValue={handleChange}
			value={lang}
			anchorIcon={({ style, color }) => (
				<MaterialIcons
					style={style}
					name="language"
					size={25}
					color={color}
				/>
			)}
		/>
	);
};

export default LangControl;
