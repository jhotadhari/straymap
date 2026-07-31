/**
 * External dependencies
 */
import React, { FC, ReactNode, useCallback, useMemo, useState } from 'react';
import {
	useWindowDimensions,
	Image,
	Linking,
	ScrollView,
	StyleProp,
	StyleSheet,
	View,
	ViewStyle,
} from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { MD3Theme } from 'react-native-paper/lib/typescript/types';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-native-markdown-display';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import AnimatedLogo from '../../../components/AnimatedLogo';
import license from '../../../../LICENSE.md';
import changelog from '../../../../CHANGELOG.md';
import debugInfo from '../../../../.debugInfo.json';
import packageJson from '../../../../package.json';
import renderRules from '../../../markdown/renderRules';
import { styles as markdownStyles } from '../../../markdown/styles';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import HintLink from '../../../components/generic/primitives/HintLink';
import { getMdParts, removeLeadingTrailingEmptyLines, removeLines } from '../../../markdown/utils';
import { MdPart } from '../../../markdown/types';
import { sharedStyles } from '../../../sharedStyles';

const useTitleStyle = (theme: MD3Theme) =>
	useMemo(
		() => [
			theme.fonts.headlineMedium,
		],
		[theme]
	);

const useJanglyTitleStyle = (theme: MD3Theme) =>
	useMemo(
		() => [
			theme.fonts.displayMedium,
			pageStyles.fontJangly,
			{
				marginTop: 8,
			},
		],
		[theme]
	);

const stripLinkedImages = (part: MdPart): MdPart => ({
	...part,
	str: removeLines(part.str, /\[!\[[^\]]+\]\([^\(]+\)\]\([^\(]+\)/),
});
const README_SECTION_ORDER = [
	'freeSoftware',
	'license',
	'donation',
	'contribution',
	'privacy',
	'whereToGetMaps',
	'credits',
] as const;
const changelogParts = getMdParts(changelog).slice(1).map(stripLinkedImages);

const getChangelogVersion = (idx?: number): string | undefined => {
	idx = idx ?? 0;
	const version = changelogParts[idx]?.key;
	return version ? version.replace(/[\]\[]/g, '') : undefined;
};

const openKofiUrl = () => Linking.openURL('https://ko-fi.com/H2H3162PAG');
const openLiberapayUrl = () => Linking.openURL('https://liberapay.com/jhotadhari/donate');

const AccordionItem = ({
	label,
	children,
	notExpandedContent,
	accordionContentStyle,
}: {
	label: string;
	children?: string | ReactNode;
	notExpandedContent?: string | ReactNode;
	accordionContentStyle?: StyleProp<ViewStyle>;
}) => {
	const theme = useTheme();
	const [expanded, setExpanded] = useState(false);

	const titleStyle = useTitleStyle(theme);

	const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);

	const dynamicStyles = useMemo(
		() => ({
			accordionContentStyle: [pageStyles.accordionContent, accordionContentStyle],
			buttonContentStyle: [sharedStyles.flexRowCenter, pageStyles.accordionLabel],
		}),
		[accordionContentStyle]
	);

	return (
		<View style={pageStyles.accordionContainer}>
			<ButtonHighlight
				// ! exception: don't use useButtonProps here!
				onPress={toggleExpanded}
				contentStyle={dynamicStyles.buttonContentStyle}
			>
				<Text style={titleStyle}>{label}</Text>
				<Icon
					source={expanded ? 'chevron-down' : 'chevron-right'}
					size={30}
				/>
			</ButtonHighlight>

			{expanded && (
				<View style={dynamicStyles.accordionContentStyle}>
					{'string' === typeof children && <Text>{children}</Text>}
					{'string' !== typeof children && children}
				</View>
			)}

			{!expanded && undefined !== notExpandedContent && (
				<View style={pageStyles.accordionContent}>
					{'string' === typeof notExpandedContent && <Text>{notExpandedContent}</Text>}
					{'string' !== typeof notExpandedContent && notExpandedContent}
				</View>
			)}
		</View>
	);
};

const MdPartsRenderPart = ({ part, style }: { part: MdPart; style: StyleProp<ViewStyle> }) => {
	const theme = useTheme();
	const titleStyle = useTitleStyle(theme);
	return (
		<View style={style}>
			{part.key.length > 0 && <Text style={titleStyle}>{part.key}</Text>}
			<Markdown
				rules={renderRules}
				style={markdownStyles(theme) as StyleSheet.NamedStyles<any>}
			>
				{part.str}
			</Markdown>
		</View>
	);
};

const MdPartsRenderPartDonation = ({
	part,
	style,
}: {
	part: MdPart;
	style: StyleProp<ViewStyle>;
}) => {
	const theme = useTheme();

	const titleStyle = useTitleStyle(theme);

	const linkStyle = useMemo(
		() => [pageStyles.donationLink, { color: get(theme.colors, 'link') }],
		[theme]
	);

	const parts = part.str.split('\n\n');

	if (parts.length < 2) {
		return (
			<MdPartsRenderPart
				key={part.key}
				style={style}
				part={part}
			/>
		);
	}

	return (
		<View style={style}>
			{part.key.length > 0 && <Text style={titleStyle}>{part.key}</Text>}

			<Markdown
				rules={renderRules}
				style={markdownStyles(theme) as StyleSheet.NamedStyles<any>}
			>
				{parts.slice(0, parts.length - 1).join('\n\n')}
			</Markdown>

			<Text
				style={linkStyle}
				onPress={openKofiUrl}
			>
				<Image source={require('../../../assets/images/ko-fi_donate.png')} />
			</Text>
			<Text
				style={linkStyle}
				onPress={openLiberapayUrl}
			>
				<Image source={require('../../../assets/images/liberapay_donate.png')} />
			</Text>

			<Markdown
				rules={renderRules}
				style={markdownStyles(theme) as StyleSheet.NamedStyles<any>}
			>
				{parts[parts.length - 1]}
			</Markdown>
		</View>
	);
};

const MdPartsRender = ({ mbParts }: { mbParts: MdPart[] }) => {
	const { t } = useTranslation();
	return (
		<View>
			{mbParts.map((part) => {
				if ('license' === part.id) {
					return (
						<AccordionItem
							label={t('ui.license')}
							key={part.id}
							notExpandedContent={license.split('\n')[0]}
						>
							{license}
						</AccordionItem>
					);
				}

				if ('donation' === part.id) {
					return (
						<MdPartsRenderPartDonation
							key={part.id}
							style={pageStyles.mdPart}
							part={part}
						/>
					);
				}

				return (
					<MdPartsRenderPart
						key={part.key}
						style={pageStyles.mdPart}
						part={part}
					/>
				);
			})}
		</View>
	);
};

const paddingLeft = 24;

const pageStyles = StyleSheet.create({
	fontJangly: { fontFamily: 'jangly_walk' },
	accordionContainer: { marginBottom: 20 },
	changelogAccordionContentStyle: { marginTop: -24 },
	accordionLabel: {
		flexDirection: 'row',
		flexBasis: '100%',
		textAlign: 'left',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginHorizontal: -12,
	},
	accordionContent: {
		paddingLeft: 10,
		paddingRight: 10,
	},
	donationLink: { height: 50 },
	mdPart: {
		maxWidth: '93%',
		marginBottom: 20,
	},
	container: {
		paddingLeft,
		paddingRight: 12,
		gap: 16,
	},
	logoWrapper: {
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: -paddingLeft / 2,
	},
});

const About: FC<{ style?: ViewStyle }> = ({ style }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { width } = useWindowDimensions();

	const versionChangelog = useMemo(() => getChangelogVersion(), []);

	const titleStyle = useJanglyTitleStyle(theme);

	const readmeParts: MdPart[] = useMemo(
		() =>
			README_SECTION_ORDER.map((id) => ({
				id,
				key: t(`ui.readmeSections.${id}.title`),
				str: stripLinkedImages({
					key: t(`ui.readmeSections.${id}.title`),
					str: t(`ui.readmeSections.${id}.body`),
				}).str,
			})),
		[t]
	);

	const debugInfoNodes = useMemo(
		() =>
			Object.keys(debugInfo).map((key: string) => {
				let string = get(debugInfo, key, '');
				if ('gitStatus' === key) {
					string = string.replace(/;/g, '\n');
				}
				return (
					<Text key={key}>
						{t('ui.' + key) + ': ' + removeLeadingTrailingEmptyLines(string)}
					</Text>
				);
			}),
		[t]
	);

	return (
		<ScrollView style={style}>
			<View style={pageStyles.container}>
				<Text style={titleStyle}>Straymap</Text>

				<Text>{t('ui.slogan')}</Text>

				{'Unreleased' === versionChangelog && (
					<View>
						<Text>Version {versionChangelog}</Text>
						<Text>Latest release {getChangelogVersion(1) || packageJson.version}</Text>
						{debugInfoNodes}
					</View>
				)}

				<HintLink
					label={t('ui.sourceHostedOnGithub')}
					url="https://github.com/jhotadhari/straymap"
				/>

				<View style={pageStyles.logoWrapper}>
					<AnimatedLogo
						size={width}
						shouldShit={true}
						animateOnPress={true}
					/>
				</View>

				<MdPartsRender mbParts={readmeParts} />

				<AccordionItem
					label={t('ui.changelog')}
					accordionContentStyle={pageStyles.changelogAccordionContentStyle}
				>
					<MdPartsRender
						mbParts={[
							{
								key: '',
								str: [...changelogParts]
									.map((part) => '## ' + part.key + '\n' + part.str)
									.join('\n\n'),
							},
						]}
					/>
				</AccordionItem>
			</View>
		</ScrollView>
	);
};

export default About;
