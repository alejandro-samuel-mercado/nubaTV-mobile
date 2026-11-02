import { useIsFocused } from "expo-router";
import React, { memo, useEffect, useRef } from "react";
import { Animated, Easing, StyleProp, ViewStyle } from "react-native";

/**
 * All animations use the classic Animated API with the native driver
 * (opacity/transform only) so they run on the UI thread on any Android 10+
 * device, without relying on Reanimated worklets.
 */

const EASE = Easing.out(Easing.cubic);

/** Fades + slides a whole screen in every time it gains focus. */
export const ScreenTransition = memo(function ScreenTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const focused = useIsFocused();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!focused) return;
    v.setValue(0);
    Animated.timing(v, {
      toValue: 1,
      duration: 340,
      easing: EASE,
      useNativeDriver: true,
    }).start();
  }, [focused]);
  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: v,
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
});

/** Staggered entrance for list/grid items. Only animates on first mount. */
export const FadeInItem = memo(function FadeInItem({
  index = 0,
  children,
  style,
  from = "bottom",
}: {
  index?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  from?: "bottom" | "right";
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 380,
      delay: Math.min(index, 10) * 45,
      easing: EASE,
      useNativeDriver: true,
    }).start();
  }, []);
  const offset = v.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [
            from === "right" ? { translateX: offset } : { translateY: offset },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
});
