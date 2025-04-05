/**
 * External dependencies
 */
import { Component } from "react";
import { TextInput, TextInputProps } from "react-native";

/**
 * Native multiline TextInput components that auto resize when updating text.
 *
 * Idea from https://dev.to/somidad/auto-resize-multiline-textinput-in-react-native-478n
 *
 * But changed them to class components. In order to use them inside render prop
 * for react-native-paper TextInput. Because it will pass a ref, and refs can not be
 * assigned to functional components.
 */

const initialHeight = 40;

type State = {
    height: number,
};

export class TextInputNativeMultiline extends Component<TextInputProps, State> {

    state: State = {
        height: initialHeight,
    };

	render() {
		const {
			style,
		} = this.props;

        const {
            height,
        } = this.state;

        return <TextInput
            { ...{
                ...this.props,
                style: [
                    ...( style && Array.isArray( style ) ? style : [] ),
                    {
                        height,
                        ...( style && ! Array.isArray( style ) && 'object' === typeof style && { ...style } ),
                    }
                ],
                onContentSizeChange: ( event ) => {
                    this.setState( {
                        ...this.state,
                        height: event.nativeEvent.contentSize.height,
                    } )
                }
            } }
        />;
    }
};

type StateControlled = {
    height: number,
    rerenderKey: number,
};

export class TextInputNativeMultilineControlled extends Component<TextInputProps, StateControlled> {

    state: StateControlled = {
        height: initialHeight,
        rerenderKey: new Date().getTime(),
    };

    componentDidUpdate( prevProps: TextInputProps ) {
        if ( this.props.value !== prevProps.value ) {
            this.setState( {
                ...this.state,
                rerenderKey: new Date().getTime(),
            } );
        }
    }

	render() {
		const {
			style,
		} = this.props;

		const {
			rerenderKey,
			height,
		} = this.state;

        return <TextInput
            key={ rerenderKey }
            { ...{
                ...this.props,
                style: [
                    ...( style && Array.isArray( style ) ? style : [] ),
                    {
                        height,
                        ...( style && ! Array.isArray( style ) && 'object' === typeof style && { ...style } ),
                    }
                ],
                onContentSizeChange: ( event ) => {
                    this.setState( {
                        ...this.state,
                        height: event.nativeEvent.contentSize.height,
                    } )
                }
            } }
        />;
    }
};