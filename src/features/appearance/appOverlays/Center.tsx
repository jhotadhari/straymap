/**
 * External dependencies
 */
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { SvgXml } from 'react-native-svg';
import { readFile } from 'react-native-fs';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectCursor } from '../selectors';
import { CursorConfig } from '../types';
import { AppContext } from '../../../Context';

export const CenterInner = ({ cursor }: { cursor?: CursorConfig }) => {
	const cursorConfigFromStore = useAppSelector(selectCursor);

	const cursorConfig = cursor || cursorConfigFromStore;

	const [xml, setXml] = useState('');

	useEffect(() => {
		if (
			cursorConfig &&
			(cursorConfig.iconSource.startsWith('content://') ||
				cursorConfig.iconSource.startsWith('/')) &&
			cursorConfig.iconSource.endsWith('.svg')
		) {
			readFile(cursorConfig.iconSource, 'utf8')
				.then((newXml: string) => {
					setXml(newXml);
				})
				.catch((err: any) => {
					console.log('ERROR readFile', err);
				});
		} else {
			setXml('');
		}
	}, [cursorConfig]);

	const styleSize = useMemo(
		() => ({ width: cursorConfig?.size, height: cursorConfig?.size }),
		[cursorConfig?.size]
	);

	return (
		<View>
			{cursorConfig &&
				!cursorConfig.iconSource.startsWith('content://') &&
				!cursorConfig.iconSource.startsWith('/') && (
					<Icon
						source={cursorConfig.iconSource}
						color={cursorConfig.color}
						size={cursorConfig.size}
					/>
				)}

			{cursorConfig && cursorConfig.iconSource.toLowerCase().endsWith('.svg') && xml && (
				<View style={styleSize}>
					<SvgXml
						xml={xml}
						width="100%"
						height="100%"
					/>
				</View>
			)}

			{cursorConfig && cursorConfig.iconSource.toLowerCase().endsWith('.png') && (
				<View style={styleSize}>
					<Image
						source={{
							uri: cursorConfig.iconSource.startsWith('/')
								? 'file://' + cursorConfig.iconSource
								: cursorConfig.iconSource,
						}}
						style={styleSize}
					/>
				</View>
			)}
		</View>
	);
};

const Center = () => {
	const { mapHeight } = useContext(AppContext);
	const { width } = useMemo(() => Dimensions.get('window'), []);

	const styleWrapper = useMemo(
		() => [styles.wrapper, { width, height: mapHeight || 0 }],
		[width, mapHeight]
	);
	return (
		<View
			style={styleWrapper}
			pointerEvents="box-none"
		>
			<CenterInner />
		</View>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		position: 'absolute',
		top: 0,
		left: 0,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default Center;
