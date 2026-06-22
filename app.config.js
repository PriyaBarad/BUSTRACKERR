// app.config.js — Dynamic Expo config.
// Runs at every `expo start` / `expo build`, so buildDate is always fresh.

module.exports = ({ config }) => {
  return {
    ...config,
    // extra must be at the expo root for Constants.expoConfig.extra to work
    extra: {
      // preserve existing extra (router, eas) from app.json
      ...(config.extra ?? {}),
      // injected fresh on every build / expo start
      buildDate: new Date().toISOString(),
    },
  };
};
