const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Assure le bundling des polices vectorielles (.ttf) en release
config.resolver.assetExts = Array.from(
  new Set([...(config.resolver.assetExts ?? []), 'ttf', 'otf']),
);

module.exports = config;
