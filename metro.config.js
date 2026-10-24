// metro.config.js

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The bundled forest boundary snapshot ships as a raw asset rather than a JS module,
// which would compile to several MB of bytecode (see services/offline/boundaryStore.ts)
config.resolver.assetExts.push('esrijson');

module.exports = config;
