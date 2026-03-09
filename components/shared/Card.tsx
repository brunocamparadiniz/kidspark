import React from 'react';
import { View, StyleSheet, type ViewStyle, type ViewProps } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/themes';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style, ...props }: CardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.parent.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
