// app.config.js — adds secrets from the environment to app.json.
// Locally they come from .env.local (see .env.example); on EAS, from EAS environment variables.

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: { apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY },
    },
  },
});
