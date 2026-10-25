const { withAndroidManifest } = require('@expo/config-plugins');

// The backend is a server the user hosts themselves, usually plain http on a LAN
// address. Android blocks cleartext traffic in release builds unless the manifest
// opts in; only the debug manifest does that by default.
module.exports = (config) =>
  withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (application) application.$['android:usesCleartextTraffic'] = 'true';
    return config;
  });
