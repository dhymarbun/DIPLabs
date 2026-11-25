const baseConfig = require('./app.json');

module.exports = ({ config }) => ({
  ...baseConfig.expo,
  ...config,
  android: {
    ...baseConfig.expo.android,
    ...config?.android,
    config: {
      ...baseConfig.expo.android?.config,
      ...config?.android?.config,
      googleMaps: {
        ...baseConfig.expo.android?.config?.googleMaps,
        ...config?.android?.config?.googleMaps,
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
      },
    },
  },
});
