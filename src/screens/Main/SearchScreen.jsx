import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AUTH_COLORS } from '../auth/authTheme';

const SearchScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Search</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: AUTH_COLORS.text,
  },
});

export default SearchScreen;
