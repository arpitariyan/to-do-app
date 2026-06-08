# Astra - AI-Powered Productivity App

![Astra Logo](./assets/app-logo.jpeg)

Astra is a modern, AI-powered productivity application designed to seamlessly manage tasks, notes, and daily schedules. Built with React Native and Expo, and backed by Appwrite, Astra delivers a dynamic, responsive, and aesthetically stunning interface tailored for Android devices.

## ✨ Features

- **Dynamic Task Management:** Create, track, and complete tasks with an intuitive interface.
- **Rich Note-Taking:** Capture ideas quickly and interact with them seamlessly.
- **AI Assistant Integration (Groq LLaMA 3.3):** Manage your workflow using natural language! Ask the AI to create tasks, summarize notes, and plan your day. 
- **Premium UI/UX:** A stunning interface with smooth micro-animations, glassmorphism, and curated typography.
- **Authentication & Security:** Powered by Appwrite for secure login and data sync. App lock and Biometric unlock available for privacy.
- **Offline Capable:** Data is seamlessly fetched and cached for quick access.

## 🚀 Tech Stack

- **Framework:** React Native / Expo
- **Language:** TypeScript
- **State Management:** Zustand, React Query
- **Styling:** StyleSheet, React Native Reanimated
- **Backend & Auth:** Appwrite (Database, Auth, Storage)
- **AI Models:** Groq (LLaMA 3.3)

## 🛠️ Setup Instructions

To run this project locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/arpitariyan/to-do-app.git
   cd to-do-app
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Rename `.env.example` to `.env` and fill in your API keys:
   ```bash
   EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_appwrite_project_id
   EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
   EXPO_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=your_storage_bucket_id
   EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key_1
   EXPO_PUBLIC_GROQ_API_KEY_2=your_groq_api_key_2
   EXPO_PUBLIC_GROQ_API_KEY_3=your_groq_api_key_3
   ```

4. **Run the App:**
   ```bash
   npx expo start
   ```

## 📦 Releases

You can download the latest APK from the [Releases](https://github.com/arpitariyan/to-do-app/releases) section. The APK is optimized for Android 11 and above.

## 📄 License

This project is licensed under the MIT License.
