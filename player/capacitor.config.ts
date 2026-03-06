import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.beets.player',
  appName: 'Beets Player',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0f',
    },
  },
  ios: {
    backgroundColor: '#0a0a0f',
    contentInset: 'automatic',
  },
  android: {
    backgroundColor: '#0a0a0f',
    allowMixedContent: true,
  },
}

export default config
