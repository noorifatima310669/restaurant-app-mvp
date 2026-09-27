import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  Image, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { shadows } from '../theme/colors';

function MenuItemCard({ item, isFavourite, onAdd, onToggleFavourite }) {
  const { colors } = useTheme();
  console.log('MenuItemCard rendered:', item.name);

  return (
    <View style={[
      styles.card,
      shadows.card,
      { backgroundColor: colors.surface, borderColor: colors.border },
      !item.isAvailable && styles.unavailable,
    ]}>
      <View>
        <Image
          source={item.image}
          resizeMode="cover"
          style={styles.image}
        />
        <Pressable
          accessibilityLabel={isFavourite ? `Remove ${item.name} from favourites` : `Add ${item.name} to favourites`}
          onPress={() => onToggleFavourite(item.id)}
          style={({ pressed }) => [styles.heart, { backgroundColor: colors.surfaceElevated }, pressed && styles.pressed]}
        >
          <Ionicons name={isFavourite ? 'heart' : 'heart-outline'} size={21} color={isFavourite ? colors.danger : colors.text} />
        </Pressable>
        {item.isSpecial ? (
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Ionicons name="sparkles" size={13} color="#35172F" />
            <Text style={styles.badgeText}>DAILY SPECIAL</Text>
          </View>
        ) : null}
        {!item.isAvailable ? (
          <View style={[styles.soldOut, { backgroundColor: colors.overlay }]}>
            <Text style={styles.soldOutText}>CURRENTLY UNAVAILABLE</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={[styles.category, { color: colors.olive }]}>{item.category.toUpperCase()}</Text>
        <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
        <Text numberOfLines={2} style={[styles.description, { color: colors.textSecondary }]}>{item.description}</Text>
        <View style={styles.footer}>
          <Text style={[styles.price, { color: colors.text }]}>PKR {item.price.toLocaleString()}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={!item.isAvailable}
            onPress={() => onAdd(item)}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: item.isAvailable ? colors.primary : colors.muted },
              pressed && item.isAvailable && styles.pressed,
            ]}
          >
            <Ionicons name="add" size={19} color={item.isAvailable ? colors.background : colors.textSecondary} />
            <Text style={[styles.addText, { color: item.isAvailable ? colors.background : colors.textSecondary }]}>Add</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default memo(MenuItemCard);

const styles = StyleSheet.create({
  card: { marginHorizontal: 20, marginBottom: 18, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  unavailable: { opacity: 0.72 },
  image: { width: '100%', height: 196 },
  heart: { position: 'absolute', right: 14, top: 14, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', left: 14, top: 14, borderRadius: 15, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
  badgeText: { color: '#35172F', fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  soldOut: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingVertical: 10, alignItems: 'center' },
  soldOutText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  body: { padding: 18 },
  category: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  name: { fontSize: 21, fontWeight: '800', marginTop: 5 },
  description: { fontSize: 14, lineHeight: 20, marginTop: 7 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 17 },
  price: { fontSize: 17, fontWeight: '900' },
  addButton: { minHeight: 42, borderRadius: 14, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText: { fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
