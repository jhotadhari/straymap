/**
 * External dependencies
 */
import { FC, memo } from 'react';

/**
 * Internal dependencies
 */
import FileLimitControl from './FileLimitControl';
import KeepAppActiveControl from './KeepAppActiveControl';
import MergeModeControl from './MergeModeControl';
import OverwriteModeControl from './OverwriteModeControl';
import ImportButton from './ImportButton';
import TitleExtractControl from './TitleExtractControl';
import TagExtractControl from './TagExtractControl';
import FeatureFileList from './FeatureFileList';
import DateExtractRowControl from './DateExtractRowControl';

const StepConfiguration: FC = () => {
	return (
		<>
			<FeatureFileList />
			<FileLimitControl />
			<KeepAppActiveControl />
			<MergeModeControl />
			<OverwriteModeControl />
			<TitleExtractControl />
			<TagExtractControl />
			<DateExtractRowControl />
			<ImportButton />
		</>
	);
};

export default memo(StepConfiguration);
