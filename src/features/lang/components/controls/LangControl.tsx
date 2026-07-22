/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import LucideIcons from '@react-native-vector-icons/lucide/static';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import ListItemMenuControl from '../../../../components/generic/wrapper/ListItemMenuControl';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectLang } from '../../selectors';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '../../../../assets/i18n/constants';
import { setLang } from '../../slice';
import { sortArrayByOrderArray } from '../../../../lib/utilsLight';

const LangControl: FC = () => {
	const { t, i18n } = useTranslation();
	const dispatch = useAppDispatch();

	const lang = useAppSelector(selectLang);
	const handleChange = useCallback(
		(newLang: string) => dispatch(setLang(newLang)),
		[
			dispatch,
		]
	);

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

	const anchorLabel = useMemo(
		() =>
			(sortArrayByOrderArray([...SUPPORTED_LANGUAGES], [i18n.language]) as string[])
				.map((l) => t('lang.selectLang', { lng: l }))
				.reverse()
				.join(' / '),
		[t, i18n.language]
	);

	return (
		<ListItemMenuControl
			anchorLabel={anchorLabel}
			anchorLabelAppendSelected={true}
			options={options}
			setValue={handleChange}
			value={lang}
			anchorIcon={({ color }) => (
				<LucideIcons
					color={color}
					size={25}
					name="languages"
				/>
			)}
		/>
	);
};

export default LangControl;
