const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// If you are using Expo Router, this is mandatory
config.resolver.resolverMainFields.unshift('react-native'); 

module.exports = config;
