// https://docs.expo.dev/versions/latest/sdk/sqlite/ — expo-sqlite na web używa WebAssembly
// i SharedArrayBuffer, więc serwer podglądu musi podać nagłówki COOP/COEP.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  return middleware(req, res, next);
};

module.exports = config;
