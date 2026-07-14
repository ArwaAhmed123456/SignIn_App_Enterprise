module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind v4 (Expo) must be added as a PRESET, not a plugin.
    // Putting it in plugins causes: ".plugins is not a valid Plugin property"
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Reanimated plugin must be listed (and should be last)
    plugins: ['react-native-reanimated/plugin'],
  };
};
