import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Astra',
  slug: 'astra-productivity',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/app-logo.jpeg',
  userInterfaceStyle: 'automatic',
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/app-logo.jpeg',
      backgroundColor: '#0D0F14',
    },
    package: 'com.personal.nexus',
    permissions: [
      'USE_BIOMETRIC',
      'USE_FINGERPRINT',
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'CAMERA',
      'RECORD_AUDIO',
    ],
  },
  scheme: 'nexus',
  extra: {
    appwriteEndpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
    appwriteProjectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
    appwriteDatabaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
    appwriteStorageBucketId: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_BUCKET_ID,
    geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
    eas: {
      projectId: 'your-eas-project-id',
    },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-local-authentication',
      {
        faceIDPermission: 'Allow Astra to use Face ID for app lock.',
      },
    ],
    'expo-notifications',
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow Astra to access your photos for attachments.',
        cameraPermission: 'Allow Astra to use your camera for attachments.',
      },
    ],
    [
      'expo-document-picker',
      {
        iCloudContainerEnvironment: 'Production',
      },
    ],
    [
      'expo-av',
      {
        microphonePermission: 'Allow Astra to record voice notes.',
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 30,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});
