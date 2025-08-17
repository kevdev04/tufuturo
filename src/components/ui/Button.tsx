import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
  StyleProp,
} from 'react-native';
import { violetTheme } from '../../theme/colors';

export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  onPress,
  children,
  style,
  textStyle,
}) => {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'default' ? violetTheme.colors.primaryForeground : violetTheme.colors.primary} 
        />
      ) : (
        typeof children === 'string' ? (
          <Text style={textStyles}>{children}</Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>{children}</View>
        )
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: violetTheme.borderRadius.md,
    paddingHorizontal: violetTheme.spacing.md,
    paddingVertical: violetTheme.spacing.sm,
    minHeight: 40,
  },
  
  // Variants
  default: {
    backgroundColor: violetTheme.colors.primary,
  },
  destructive: {
    backgroundColor: violetTheme.colors.destructive,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: violetTheme.colors.border,
  },
  secondary: {
    backgroundColor: violetTheme.colors.secondary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  link: {
    backgroundColor: 'transparent',
  },
  
  // Sizes
  sm: {
    minHeight: 36,
    paddingHorizontal: violetTheme.spacing.sm,
    paddingVertical: 6,
  },
  lg: {
    minHeight: 44,
    paddingHorizontal: violetTheme.spacing.xl,
    paddingVertical: violetTheme.spacing.md,
  },
  icon: {
    minHeight: 40,
    minWidth: 40,
    paddingHorizontal: violetTheme.spacing.sm,
    paddingVertical: violetTheme.spacing.sm,
  },
  
  // Text styles
  text: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Variant text styles
  defaultText: {
    color: violetTheme.colors.primaryForeground,
  },
  destructiveText: {
    color: violetTheme.colors.destructiveForeground,
  },
  outlineText: {
    color: violetTheme.colors.foreground,
  },
  secondaryText: {
    color: violetTheme.colors.secondaryForeground,
  },
  ghostText: {
    color: violetTheme.colors.foreground,
  },
  linkText: {
    color: violetTheme.colors.primary,
    textDecorationLine: 'underline',
  },
  
  // Size text styles
  smText: {
    fontSize: 14,
  },
  lgText: {
    fontSize: 18,
  },
  iconText: {
    fontSize: 16,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
});

export default Button;
