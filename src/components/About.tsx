/**
 * External dependencies
 */
import React, {
	FC,
	useContext,
    useEffect,
    useState,
} from 'react';
import {
    Image,
    Linking,
    ScrollView,
    StyleSheet,
	useWindowDimensions,
	View,
} from 'react-native';
import {
    Icon,
	Text,
	useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-native-markdown-display';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import AnimatedLogo from './AnimatedLogo';
import readme from '../../README.md';
import license from '../../LICENSE.md';
import packageJson from '../../package.json';
import { removeLeadingTrailingEmptyLines, removeLines } from '../utils';
import renderRules from '../markdown/renderRules';
import { styles } from '../markdown/styles';
import { get } from 'lodash-es';
import ButtonHighlight from './ButtonHighlight';

type ReadmePart = {
    key: string;
    str: string;
};

const readmeParts: ReadmePart[] = [...readme.split( /\n##\s[\s\S]*?/g )].map( str => {
    const key = str.match( /(.*?)\n/ );
    return key ? {
        key: key[1],
        str: removeLeadingTrailingEmptyLines( str, 1 ),
    } : null;
} ).filter( a => !! a );

const License = () => {
	const theme = useTheme();
	const { t } = useTranslation();
    const [expanded, setExpanded] = useState( false );

    // Fix vertical align. toggle expand and back.
    useEffect( () => {
        setExpanded( true );
        setTimeout( () => setExpanded( false ), 0 );
    }, [] );

    return <View style={ {
        marginTop: -20,
        marginBottom: 20,
    } }>
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
                <Text style={ theme.fonts.displaySmall }>{ t( 'license' ) }</Text>
            </View>

        </ButtonHighlight>

        { expanded && <Text style={ {
            paddingLeft: 10,
            paddingRight: 10,
        } }>{ license }</Text> }

        { ! expanded && <Text style={ {
            paddingLeft: 10,
            paddingRight: 10,
        } }>{ license.split( '\n' )[0] }</Text> }

    </View>;
};

const ReadmeRender = ( {
    include,
} : {
    include: string[];
} ) => {
	const { t } = useTranslation();
	const theme = useTheme();
    return [...include].map( key => {

        const part: undefined | ReadmePart = readmeParts.find( part => part.key === key );

        if ( ! part ) {
            return null;
        }

        if ( 'License' === part.key ) {
            return <License key={ part.key }/>;
        }

        if ( 'Contribution' === part.key ) {
            part.str = removeLines( part.str, /(?:liberapay|ko-fi)/ );
        }

        return <View
            key={ part.key }
            style={ {
                maxWidth: '93%',
                marginBottom: 20,
            } }
        >
            <Text style={ theme.fonts.displaySmall }>{ t( part.key.toLowerCase() ) }</Text>
            <Markdown
                rules={ renderRules }
                style={ styles( theme ) as StyleSheet.NamedStyles<any> }
            >
                { part.str }
            </Markdown>

            { 'Contribution' === part.key && <View>
                <Text style={ { height: 50, color: get( theme.colors, 'link' ) } } onPress={ () => Linking.openURL( 'https://ko-fi.com/H2H3162PAG' ) }>
                    <Image source={ require( '../assets/images/ko-fi_donate.png' ) } />
                </Text>
                <Text style={ { height: 50, color: get( theme.colors, 'link' ) } } onPress={ () => Linking.openURL( 'https://liberapay.com/jhotadhari/donate' ) }>
                    <Image source={ require( '../assets/images/liberapay_donate.png' ) } />
                </Text>
            </View> }

        </View>
    } );
};

const About : FC = () => {

	const theme = useTheme();
	const { t } = useTranslation();
	const { width } = useWindowDimensions();

    const {
        appInnerHeight,
    } = useContext( AppContext )

    return <View style={ {
        backgroundColor: theme.colors.background,
        height: appInnerHeight,
        width,
        position: 'absolute',
        zIndex: 9,
    } } >
        <ScrollView style={ { padding: 15, paddingLeft: 20 } } >

            <Text style={ theme.fonts.displaySmall }>Straymap</Text>
            <Text style={ { marginTop: 10 } } >{ t( 'slogan' ) }</Text>
            <Text style={ { marginTop: 20 } } >version { packageJson.version }</Text>

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

            <ReadmeRender
                include={ [
                    'License',
                    'Contribution',
                    'Where to get maps?',
                    'Credits',
                ] }
            />

        </ScrollView>
    </View>;

};

export default About;