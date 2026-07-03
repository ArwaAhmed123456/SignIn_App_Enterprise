const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix for react-native-web resolution errors in newer Expo/RN versions
config.resolver.alias = {
    ...config.resolver.alias,
    'react-native-web/dist/exports/ActivityIndicator': 'react-native-web/dist/exports/ActivityIndicator/index.js',
    'react-native-web/dist/exports/DeviceEventEmitter': 'react-native-web/dist/exports/DeviceEventEmitter/index.js'
};

module.exports = config;
