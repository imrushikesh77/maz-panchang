import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';

type Props = {
    width?: number | `${number}%`;
    height: number;
    borderRadius?: number;
    style?: ViewStyle;
};

export function ShimmerBlock({ width, height, borderRadius = 8, style }: Props) {
    const opacity = useRef(new Animated.Value(0.35)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.8,
                    duration: 650,
                    useNativeDriver: true
                }),
                Animated.timing(opacity, {
                    toValue: 0.35,
                    duration: 650,
                    useNativeDriver: true
                })
            ])
        );

        loop.start();
        return () => loop.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.base,
                {
                    height,
                    borderRadius,
                    opacity,
                    ...(width !== undefined ? { width } : {})
                },
                style
            ]}
        />
    );
}

const styles = StyleSheet.create({
    base: {
        backgroundColor: '#E9E0D1'
    }
});
