import React from 'react';
import { Animated, Text, Easing, Platform, StatusBar } from "react-native";
import { IOStyle } from "./iOStyle";
import { TapticFeedback } from "../../index";

const animatedDuration = 350;
const minVelocityToFling = -250;
const navBarOffset = 56;

const IS_IOS = Platform.OS === 'ios';

export class NotificationBase extends React.Component {

	static show;
	static hide;

	constructor(props) {
		super(props);

		NotificationBase.show = () => {
			try {
				this.show();
			} catch (e) {
				throw new Error('Unable to show Notification, because there is no instance of Notification');
			}
		};
		NotificationBase.hide = () => {
			try {
				this.hide();
			} catch (e) {
				throw new Error('Unable to show Notification, because there is no instance of Notification');
			}
		}
	}

	/**
	 * onLayout is not invoked immediately, so by default the value is pretty high.
	 * Afterwards the value will be changed depending on the @viewHeight value
	 */
	translateY = new Animated.Value(-9000);

	/**
	 * Default StatusBar offset.
	 * .ios component overrides it depending on the type of iPhone
	 */
	offset = 22;

	/**
	 * Height of Notification's root view, it changes after onLayout invoking
	 */
	viewHeight = 0;
	onLayoutHasBeenInvoked = false;

	timer;

	show = () => {
		const {onShow, tapticFeedback, hideStatusBar} = this.props;
		clearTimeout(this.timer);
		Animated.timing(this.translateY, {
			toValue: 0,
			useNativeDriver: true,
			duration: animatedDuration,
			easing: Easing.bezier(.0, .74, .2, IS_IOS ? 1.12 : 1)
		}).start(this.autohide);

		if (onShow) {
			onShow();
		}
		if (hideStatusBar) {
			IS_IOS && StatusBar.setHidden(true, 'slide');
		}
		if (tapticFeedback && IS_IOS) {
			TapticFeedback.impact();
		}
	};

	hide = () => {
		const {hideStatusBar, onHide} = this.props;
		Animated.timing(this.translateY, {
			toValue: (this.viewHeight + navBarOffset + this.offset * 2) * -1,
			useNativeDriver: true,
			duration: animatedDuration,
			easing: Easing.bezier(.53, .67, .19, 1.1)
		}).start();
		if (onHide) {
			onHide();
		}
		if (hideStatusBar) {
			IS_IOS && StatusBar.setHidden(false, 'slide');
		}
	};

	autohide = () => {
		const {autohide, duration} = this.props;
		autohide && (this.timer = setTimeout(this.hide, duration));
	};

	onGestureEvent = (event) => {
		const {translationY} = event.nativeEvent;

		this.translateY.setValue(translationY > 0 ? translationY / 9 : translationY / 3.5);

		if (this.props.onDragGestureEvent) {
			this.props.onDragGestureEvent(event);
		}
	};

	onHandlerStateChange = (event) => {
		const {velocityY, translationY, numberOfPointers} = event.nativeEvent;

		if (this.props.onDragGestureHandlerStateChange) {
			this.props.onDragGestureHandlerStateChange(event);
		}

		if (velocityY < minVelocityToFling && numberOfPointers === 0) {
			Animated.spring(this.translateY, {
				toValue: (this.viewHeight + this.offset * 2) * -1,
				useNativeDriver: true,
				velocity: velocityY,
			}).start();
			return;
		}

		if (translationY > ((this.viewHeight / 2) * -1) && numberOfPointers === 0) {
			this.show();
		} else {
			this.hide();
		}
	};

	handleOnLayout = (event) => {
		const {height} = event.nativeEvent.layout;
		this.viewHeight = height;
		if (!this.onLayoutHasBeenInvoked) {
			this.onLayoutHasBeenInvoked = true;
			this.translateY.setValue((height + navBarOffset + this.offset * 2) * -1)
		}
	};

	renderCustomComponent() {
		return this.props.customComponent;
	}

	renderOwnComponent() {
		const {textColor, text} = this.props;
		return <Text style={[IOStyle.text, {color: textColor}]}>{text}</Text>;
	}
}
