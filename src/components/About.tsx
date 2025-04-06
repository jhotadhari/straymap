/**
 * External dependencies
 */
import React, {
	FC,
	ReactNode,
	useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    Image,
    Linking,
    ScrollView,
    StyleProp,
    StyleSheet,
	View,
    ViewStyle,
} from 'react-native';
import {
    Icon,
	Text,
	useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-native-markdown-display';
import { get } from 'lodash-es';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import AnimatedLogo from './AnimatedLogo';
import readme from '../../README.md';
import license from '../../LICENSE.md';
import changelog from '../../CHANGELOG.md';
import debugInfo from '../../.debugInfo.json';
import packageJson from '../../package.json';
import { removeLeadingTrailingEmptyLines, removeLines } from '../utils';
import renderRules from '../markdown/renderRules';
import { styles } from '../markdown/styles';
import ButtonHighlight from './generic/ButtonHighlight';

type MdPart = {
    key: string;
    str: string;
};

const getMdParts = ( fileContent: string ) : MdPart[] => [...fileContent.split( /\n##\s[\s\S]*?/g )].map( ( str: string ) : null | MdPart => {
    const key = str.match( /(.*?)\n/ );
    return key ? {
        key: key[1],
        str: removeLeadingTrailingEmptyLines( str, 1 ),
    } : null;
} ).filter( a => null !== a ) as MdPart[];

const readmeParts = getMdParts( readme );
const changelogParts = getMdParts( changelog ).slice( 1 );

const getChangelogVersion = ( idx?: number ) : string | undefined => {
    idx = undefined === idx ? 0 : idx;
    const version = get( changelogParts, [idx,'key'] );
    return version ? version.replace( /[\]\[]/g, '' ) : undefined;
};

const AccordionItem = ( {
    label,
    children,
    notExpandedContent,
} : {
    label: string;
    children?: string | ReactNode;
    notExpandedContent?: string | ReactNode;
} ) => {
	const theme = useTheme();
    const [expanded, setExpanded] = useState( false );

    // Fix vertical align. toggle expand and back.
    useEffect( () => {
        setExpanded( true );
        setTimeout( () => setExpanded( false ), 0 );
    }, [] );

    return <View style={ { marginBottom: 20 } }>
        <ButtonHighlight
            onPress={ () => setExpanded( ! expanded ) }
            labelStyle={ {
                flexDirection: 'row',
                flexBasis: '100%',
                textAlign: 'left',
                alignItems: 'center',
                justifyContent: 'center',
            } }
        >
            <View
                style={ {
                    flexDirection: 'row',
                    alignItems: 'center',
                } }
            >
                <Icon
                    source={ expanded ? 'chevron-down' : 'chevron-right' }
                    size={ 25 }
                />
                <Text style={ { ...theme.fonts.displaySmall, fontFamily: 'jangly_walk' } }>{ label }</Text>
            </View>

        </ButtonHighlight>

        { expanded && <View style={ {
            paddingLeft: 10,
            paddingRight: 10,
        } }>
            { 'string' === typeof children && <Text>{ children }</Text> }
            { 'string' !== typeof children && children }
        </View> }

        { ! expanded && undefined !== notExpandedContent && <View style={ {
            paddingLeft: 10,
            paddingRight: 10,
        } }>
            { 'string' === typeof notExpandedContent && <Text>{ notExpandedContent }</Text> }
            { 'string' !== typeof notExpandedContent && notExpandedContent }
        </View> }

    </View>;
};

const MdPartsRenderPart = ( {
    part,
    style,
} : {
    part: MdPart;
    style: StyleProp<ViewStyle>;
} ) => {
	const theme = useTheme();
    return <View style={ style } >
        { part.key.length > 0 && <Text style={ { ...theme.fonts.displaySmall, fontFamily: 'jangly_walk' } }>{ part.key }</Text> }
        <Markdown
            rules={ renderRules }
            style={ styles( theme ) as StyleSheet.NamedStyles<any> }
        >
            { part.str }
        </Markdown>
    </View>;
};

const MdPartsRenderPartDonation = ( {
    part,
    style,
} : {
    part: MdPart;
    style: StyleProp<ViewStyle>;
} ) => {
	const { t } = useTranslation();
	const theme = useTheme();

    const parts = part.str.split( '\n\n' );

    if ( parts.length < 2 ) {
        return <MdPartsRenderPart
            key={ part.key }
            style={ style }
            part={ part }
        />;
    }

    const linkStyle = { height: 50, color: get( theme.colors, 'link' ) };

    return <View style={ style } >
        { part.key.length > 0 && <Text style={ { ...theme.fonts.displaySmall, fontFamily: 'jangly_walk' } }>{ part.key }</Text> }

        <Markdown
            rules={ renderRules }
            style={ styles( theme ) as StyleSheet.NamedStyles<any> }
        >
            { parts.slice( 0, parts.length - 1).join( '\n\n' ) }
        </Markdown>

        <Text style={ linkStyle } onPress={ () => Linking.openURL( 'https://ko-fi.com/H2H3162PAG' ) }>
            <Image source={ require( '../assets/images/ko-fi_donate.png' ) } />
        </Text>
        <Text style={ {...linkStyle } } onPress={ () => Linking.openURL( 'https://liberapay.com/jhotadhari/donate' ) }>
            <Image source={ require( '../assets/images/liberapay_donate.png' ) } />
        </Text>

        <Markdown
            rules={ renderRules }
            style={ styles( theme ) as StyleSheet.NamedStyles<any> }
        >
            { parts[parts.length-1] }
        </Markdown>

    </View>;
};

const MdPartsRender = ( {
    include,
    mbParts,
} : {
    include?: string[];
    mbParts: MdPart[];
} ) => {
	const { t } = useTranslation();
    return <View>{ [...( include || [...mbParts].map( part => part.key ) )].map( key => {

        const part: undefined | MdPart = mbParts.find( part => part.key === key );

        if ( ! part ) {
            return null;
        }

        // Remove lines with linked images.
        part.str = removeLines( part.str, /\[!\[[^\]]+\]\([^\(]+\)\]\([^\(]+\)/ );

        if ( 'License' === part.key ) {
            return <AccordionItem
                label={ t( 'license' ) }
                key={ part.key }
                notExpandedContent={ license.split( '\n' )[0] }
            >{ license }</AccordionItem>;
        }

        const style: StyleProp<ViewStyle> = {
            maxWidth: '93%',
            marginBottom: 20,
        };

        if ( 'Donation' === part.key ) {
            return <MdPartsRenderPartDonation
                key={ part.key }
                style={ style }
                part={ part }
            />
        }

        return <MdPartsRenderPart
            key={ part.key }
            style={ style }
            part={ part }
        />;

    } ) }</View>;
};

const About : FC = () => {

	const theme = useTheme();
	const { t } = useTranslation();
	const { width } = useSafeAreaFrame();

    const {
        appInnerHeight,
    } = useContext( AppContext )

    const versionChangelog = useMemo( () => getChangelogVersion(), [] );

    return <View style={ {
        backgroundColor: theme.colors.background,
        height: appInnerHeight,
        width,
        position: 'absolute',
        zIndex: 9,
    } } >
        <ScrollView style={ { padding: 15, paddingLeft: 20 } } >

            <Text style={ { ...theme.fonts.displaySmall, fontFamily: 'jangly_walk' } }>Straymap</Text>
            <Text style={ { marginTop: 10 } } >{ t( 'slogan' ) }</Text>
            <Text style={ { marginTop: 20 } } >Version { versionChangelog }</Text>
            { 'Unreleased' === versionChangelog && <View>
                <Text>Latest release { getChangelogVersion( 1 ) || packageJson.version }</Text>
                { Object.keys( debugInfo ).map( ( key: string ) => {
                    let string = get( debugInfo, key, '' );
                    if ( 'gitStatus' === key ) {
                        string = string.replace( /#/g, '\n' );
                    }
                    return <Text key={ key } >{ t( key ) + ': ' + removeLeadingTrailingEmptyLines( string ) }</Text>;
                } ) }
            </View> }
            <Text style={ { marginTop: 10 } } >{ t( 'sourceHostedOnGithub' ) }</Text>
            <Text style={ { color: get( theme.colors, 'link' ) } } onPress={ () => Linking.openURL( 'https://github.com/jhotadhari/straymap' ) }>
                https://github.com/jhotadhari/straymap
            </Text>

            <View style={ {
                justifyContent: 'space-evenly',
                alignItems: 'center',
            } }>
                <AnimatedLogo
                    size={ width }
                    shouldShit={ true }
                    animateOnPress={ true }
                />
            </View>

            <MdPartsRender
                mbParts={ readmeParts }
                include={ [
                    'Free Software',
                    'License',
                    'Donation',
                    'Contribution',
                    'Privacy',
                    'Where to get maps?',
                    'Credits',
                ] }
            />

            <AccordionItem label={ 'Changelog' } >
                <MdPartsRender mbParts={ [ {
                    key: '',
                    str: [...changelogParts].map( part => '## ' + part.key + '\n' + part.str ).join( '\n\n' ),
                } ] }/>
            </AccordionItem>

        </ScrollView>
    </View>;

};

export default About;