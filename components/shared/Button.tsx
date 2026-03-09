import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/themes';

type Variant = 'primary' | 'secondary' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? Colors.parent.primary : Colors.parent.white}
          size="small"
        />
      ) : (
        <Text style={[styles.text, textVariantStyles[variant], textSizeStyles[size]]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
});

const variantStyles: Record<Variant, ViewStyle> = {
  primary: {
    backgroundColor: Colors.parent.primary,
  },
  secondary: {
    backgroundColor: Colors.parent.accent,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.parent.primary,
  },
};

const textVariantStyles: Record<Variant, TextStyle> = {
  primary: { color: Colors.parent.white },
  secondary: { color: Colors.parent.white },
  outline: { color: Colors.parent.primary },
};

const sizeStyles: Record<Size, ViewStyle> = {
  sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl },
};

const textSizeStyles: Record<Size, TextStyle> = {
  sm: { fontSize: FontSizes.sm },
  md: { fontSize: FontSizes.md },
  lg: { fontSize: FontSizes.lg },
};
