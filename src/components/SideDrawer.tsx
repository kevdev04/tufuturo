import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { violetTheme } from '../theme/colors';

export type SideDrawerItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  onPress: () => void;
};

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  items: SideDrawerItem[];
  user?: { name?: string | null; email?: string | null } | null;
}

const SideDrawer: React.FC<Props> = ({ visible, onClose, title = 'Menu', items, user }) => {
  const menuWidth = Math.min(300, Math.floor(Dimensions.get('window').width * 0.8));
  const translateX = useRef(new Animated.Value(menuWidth)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : menuWidth,
      duration: visible ? 220 : 200,
      useNativeDriver: true,
    }).start();
  }, [visible, menuWidth, translateX]);

  const content = useMemo(() => (
    <Animated.View style={[styles.sideMenu, { width: menuWidth, transform: [{ translateX }] }]}>
      <View style={styles.sideMenuHeader}>
        <Text style={styles.sideMenuTitle}>{title}</Text>
        <TouchableOpacity onPress={onClose} accessibilityLabel="Close menu">
          <Ionicons name="close" size={20} color={violetTheme.colors.muted} />
        </TouchableOpacity>
      </View>
      <View style={styles.sideMenuUserRow}>
        <Ionicons name="person-circle" size={28} color={violetTheme.colors.primary} />
        <View style={{ marginLeft: 8 }}>
          <Text style={styles.sideMenuUserName}>{user?.name || 'Guest'}</Text>
          <Text style={styles.sideMenuUserEmail}>{user?.email || 'Not signed in'}</Text>
        </View>
      </View>
      <View style={styles.sideMenuDivider} />
      {items.map((it, idx) => (
        <TouchableOpacity key={idx} style={styles.sideMenuItem} onPress={it.onPress}>
          <Ionicons name={it.icon} size={18} color={it.color || violetTheme.colors.foreground} />
          <Text style={[styles.sideMenuItemText, it.color ? { color: it.color } : null]}>{it.label}</Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  ), [items, menuWidth, onClose, title, translateX, user]);

  if (!visible) {
    return null;
  }

  return (
    <>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.menuBackdrop}>
        <View />
      </TouchableOpacity>
      {content}
    </>
  );
};

const styles = StyleSheet.create({
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 15,
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: violetTheme.colors.background,
    borderLeftWidth: 1,
    borderLeftColor: violetTheme.colors.border,
    paddingTop: 16,
    paddingHorizontal: 14,
    zIndex: 30,
  },
  sideMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sideMenuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: violetTheme.colors.foreground,
  },
  sideMenuUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sideMenuUserName: {
    fontWeight: '600',
    color: violetTheme.colors.foreground,
  },
  sideMenuUserEmail: {
    color: violetTheme.colors.muted,
    fontSize: 12,
  },
  sideMenuDivider: {
    height: 1,
    backgroundColor: violetTheme.colors.border,
    marginVertical: 10,
  },
  sideMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  sideMenuItemText: {
    fontSize: 14,
    color: violetTheme.colors.foreground,
    fontWeight: '600',
  },
});

export default SideDrawer;


