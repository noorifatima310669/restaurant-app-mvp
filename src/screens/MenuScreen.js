import { Ionicons } from '@expo/vector-icons';
import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  FlatList, Keyboard, Pressable, RefreshControl, SafeAreaView, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import CategoryChip from '../components/CategoryChip';
import EmptyState from '../components/EmptyState';
import LoadingScreen from '../components/LoadingScreen';
import MenuItemCard from '../components/MenuItemCard';
import { useCart } from '../context/CartContext';
import { useRestaurant } from '../context/RestaurantContext';
import { useTheme } from '../context/ThemeContext';
import { categories } from '../data/menu';
import { useDebounce } from '../hooks/useDebounce';

const SORT_OPTIONS = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Name: A to Z', 'Favourites'];

export default function MenuScreen({ navigation }) {
  const { colors } = useTheme();
  const { menuItems } = useRestaurant();
  const { dispatch } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [sort, setSort] = useState('Featured');
  const [favouriteIds, setFavouriteIds] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const previousQueryRef = useRef('');
  const renderCount = useRef(0);
  const retryTimerRef = useRef(null);
  const refreshTimerRef = useRef(null);
  renderCount.current += 1;
  // Changing a ref does not trigger a re-render; changing state does.

  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    let timer;
    let active = true;
    const menuPromise = new Promise((resolve) => {
      timer = setTimeout(() => resolve(true), 1500);
    });
    menuPromise
      .then(() => {
        if (active) setIsLoading(false);
      })
      .catch(() => {
        if (active) {
          setError('We could not prepare the menu. Please try again.');
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => () => {
    clearTimeout(retryTimerRef.current);
    clearTimeout(refreshTimerRef.current);
  }, []);

  useEffect(() => {
    const cleaned = debouncedQuery.trim();
    if (cleaned && cleaned.toLowerCase() !== previousQueryRef.current.toLowerCase()) {
      setRecentSearches((current) => [
        cleaned,
        ...current.filter((entry) => entry.toLowerCase() !== cleaned.toLowerCase()),
      ].slice(0, 5));
      previousQueryRef.current = cleaned;
    }
  }, [debouncedQuery]);

  // Derived values should be computed instead of duplicated in state because duplicate state can become stale or inconsistent.
  const visibleItems = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    let result = menuItems.filter((item) => (
      (category === 'All' || item.category === category)
      && (!normalizedQuery
        || item.name.toLowerCase().includes(normalizedQuery)
        || item.description.toLowerCase().includes(normalizedQuery))
    ));
    if (sort === 'Favourites') result = result.filter((item) => favouriteIds.includes(item.id));
    if (sort === 'Price: Low to High') result = [...result].sort((a, b) => a.price - b.price);
    if (sort === 'Price: High to Low') result = [...result].sort((a, b) => b.price - a.price);
    if (sort === 'Name: A to Z') result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'Featured') {
      result = [...result].sort((a, b) => Number(b.isSpecial) - Number(a.isSpecial));
    }
    return result;
  }, [category, debouncedQuery, favouriteIds, menuItems, sort]);

  useEffect(() => {
    navigation.setOptions({ title: `Menu (${visibleItems.length})` });
  }, [navigation, visibleItems.length]);

  const addToCart = useCallback((item) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  }, [dispatch]);

  const toggleFavourite = useCallback((id) => {
    setFavouriteIds((current) => (
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    ));
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    searchRef.current?.focus();
  }, []);

  const retry = useCallback(() => {
    clearTimeout(retryTimerRef.current);
    setError(null);
    setIsLoading(true);
    retryTimerRef.current = setTimeout(() => setIsLoading(false), 1500);
  }, []);

  const refresh = useCallback(() => {
    clearTimeout(refreshTimerRef.current);
    setIsRefreshing(true);
    refreshTimerRef.current = setTimeout(() => setIsRefreshing(false), 700);
  }, []);

  const onScroll = useCallback((event) => {
    const shouldShow = event.nativeEvent.contentOffset.y > 300;
    setShowBackToTop((current) => current === shouldShow ? current : shouldShow);
  }, []);

  const renderItem = useCallback(({ item }) => (
    <MenuItemCard
      item={item}
      isFavourite={favouriteIds.includes(item.id)}
      onAdd={addToCart}
      onToggleFavourite={toggleFavourite}
    />
  ), [addToCart, favouriteIds, toggleFavourite]);

  const header = (
    <View>
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>MADE FOR YOUR NEXT CRAVING</Text>
        <Text style={[styles.heroTitle, { color: colors.background }]}>Discover today's favourites</Text>
        <Text style={[styles.heroCopy, { color: colors.background }]}>Thoughtful plates, bright flavours, and something for every appetite.</Text>
        <View style={[styles.renderBadge, { backgroundColor: colors.primaryDark }]}>
          <Text style={[styles.renderText, { color: colors.background }]}>Renders: {renderCount.current}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Find a dish</Text>
        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: isSearchFocused ? colors.primary : colors.border }]}>
          <Pressable onPress={() => searchRef.current?.focus()} hitSlop={8}>
            <Ionicons name="search" size={21} color={colors.primary} />
          </Pressable>
          <TextInput
            ref={searchRef}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Search dishes and ingredients"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            style={[styles.searchInput, { color: colors.text }]}
          />
          {query ? (
            <Pressable onPress={clearSearch} hitSlop={8}>
              <Ionicons name="close-circle" size={21} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        {isSearchFocused && !query && recentSearches.length ? (
          <View style={styles.recents}>
            <View style={styles.recentHeading}>
              <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
              <Text style={[styles.recentLabel, { color: colors.textSecondary }]}>Recent searches</Text>
            </View>
            <View style={styles.recentChips}>
              {recentSearches.map((entry) => (
                <Pressable
                  key={entry}
                  onPress={() => {
                    setQuery(entry);
                    searchRef.current?.focus();
                  }}
                  style={[styles.recentChip, { backgroundColor: colors.muted }]}
                >
                  <Text style={[styles.recentText, { color: colors.text }]}>{entry}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.filterSection}>
        <Text style={[styles.sectionLabel, styles.insetLabel, { color: colors.text }]}>Browse the menu</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalContent}>
          {categories.map((entry) => (
            <CategoryChip key={entry} label={entry} selected={category === entry} onPress={() => setCategory(entry)} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.sortSection}>
        <Text style={[styles.sortLabel, { color: colors.textSecondary }]}>SORT & VIEW</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalContent}>
          {SORT_OPTIONS.map((entry) => (
            <Pressable
              key={entry}
              onPress={() => setSort(entry)}
              style={[styles.sortChip, {
                backgroundColor: sort === entry ? colors.accent : colors.surface,
                borderColor: sort === entry ? colors.accent : colors.border,
              }]}
            >
              {entry === 'Favourites' ? <Ionicons name="heart-outline" size={14} color={sort === entry ? colors.primaryDark : colors.textSecondary} /> : null}
              <Text style={[styles.sortText, { color: sort === entry ? colors.primaryDark : colors.textSecondary }]}>{entry}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={[styles.resultCount, { color: colors.textSecondary }]}>{visibleItems.length} {visibleItems.length === 1 ? 'dish' : 'dishes'}</Text>
      </View>
    </View>
  );

  if (isLoading) return <LoadingScreen message="Curating today's menu…" />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        ref={listRef}
        data={error ? [] : visibleItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={(
          <EmptyState
            icon={error ? 'cloud-offline-outline' : 'search-outline'}
            title={error ? 'Menu unavailable' : 'No dishes found'}
            message={error || 'Try another search, category, or view to discover something delicious.'}
            actionLabel={error ? 'Retry' : query || category !== 'All' || sort === 'Favourites' ? 'Clear filters' : undefined}
            onAction={error ? retry : () => {
              setQuery('');
              setCategory('All');
              setSort('Featured');
            }}
          />
        )}
        ListFooterComponent={<View style={styles.footerSpace} />}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={Keyboard.dismiss}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
      {showBackToTop ? (
        <Pressable
          accessibilityLabel="Back to top"
          onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
          style={({ pressed }) => [styles.topButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-up" size={21} color={colors.background} />
          <Text style={[styles.topButtonText, { color: colors.background }]}>Back to top</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  hero: { margin: 20, borderRadius: 28, padding: 24, minHeight: 210, justifyContent: 'flex-end' },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10 },
  heroTitle: { fontSize: 30, lineHeight: 35, fontWeight: '900', maxWidth: 290 },
  heroCopy: { fontSize: 14, lineHeight: 21, opacity: 0.84, marginTop: 10, maxWidth: 300 },
  renderBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9, marginTop: 15 },
  renderText: { fontSize: 10, fontWeight: '700', opacity: 0.8 },
  section: { marginHorizontal: 20, marginBottom: 22 },
  sectionLabel: { fontSize: 18, fontWeight: '900', marginBottom: 11 },
  insetLabel: { marginHorizontal: 20 },
  search: { height: 54, borderRadius: 17, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  searchInput: { flex: 1, fontSize: 15, marginHorizontal: 10 },
  recents: { marginTop: 13 },
  recentHeading: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  recentLabel: { fontSize: 12, fontWeight: '700' },
  recentChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 },
  recentChip: { borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7 },
  recentText: { fontSize: 12, fontWeight: '700' },
  filterSection: { marginBottom: 19 },
  horizontalContent: { paddingLeft: 20, paddingRight: 10 },
  sortSection: { marginBottom: 16 },
  sortLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.1, marginLeft: 20, marginBottom: 9 },
  sortChip: { minHeight: 36, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 5 },
  sortText: { fontSize: 12, fontWeight: '800' },
  resultCount: { fontSize: 12, marginHorizontal: 20, marginTop: 12 },
  footerSpace: { height: 98 },
  topButton: { position: 'absolute', right: 20, bottom: 22, height: 48, borderRadius: 24, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', gap: 7 },
  topButtonText: { fontSize: 13, fontWeight: '900' },
  pressed: { opacity: 0.8 },
});
