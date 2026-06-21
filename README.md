# Astra - AI-Powered Productivity App

<div align="center">
  <img src="./assets/app-logo.jpeg" alt="Astra Logo" width="150" style="border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); margin-bottom: 20px;">
</div>

Astra is a modern, **AI-powered productivity application** designed to seamlessly manage tasks, notes, and daily schedules. Built with React Native and Expo, and securely backed by Appwrite, Astra delivers a dynamic, responsive, and aesthetically stunning interface tailored for Android devices.

With Astra, you're not just managing a to-do list—you have an intelligent, conversational AI assistant right in your pocket.

---

## ✨ Key Features

- **🧠 Conversational AI Assistant (Powered by Groq LLaMA 3.3):** Manage your workflow using natural language!
  - **Smart Task Management:** Ask the AI to create tasks. If you forget details (time, priority, repeat), it will converse with you to fill them in, or intelligently autofill them based on context.
  - **Note Generation:** Brainstorm with the AI and have it generate comprehensive, rich HTML notes directly into your workspace.
- **✅ Dynamic Task Management:** Track and complete tasks with an intuitive, premium interface.
- **📝 Rich Note-Taking:** Capture ideas quickly and format them with the built-in HTML Rich Text Editor.
- **🎨 Premium UI/UX:** A stunning visual experience featuring sleek glassmorphism design, smooth bottom-sheet modals, micro-animations, and curated typography.
- **🔒 Advanced Security (App Lock):** Secure your personal data with a PIN or **Biometric Fingerprint Authentication**.
- **☁️ Real-time Cloud Sync:** Powered by Appwrite for secure user authentication, database management, and cloud storage.
- **⚡ Fully Optimized:** Built with R8/Proguard minification and the Hermes JS engine for lightning-fast performance. Compatible with **Android 7.0 (Nougat) and above**.

---

## 🚀 Tech Stack

- **Framework:** React Native / Expo (Expo Router)
- **Language:** TypeScript
- **State & Data Management:** Zustand (Global State), React Query (Data Fetching)
- **Styling & Animations:** Vanilla React Native StyleSheet, React Native Reanimated
- **Backend & Auth:** Appwrite (Database, Auth, Storage)
- **AI Models:** Groq API (LLaMA 3.3 Versatile) with Gemini API Fallback
- **Build Engine:** Hermes JS & Gradle (R8 Minification)

---

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
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the App Locally:**
   ```bash
   npx expo start
   ```

5. **Build the Android APK (Release):**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

---

## 📦 Releases

You can download the latest optimized APK from the [Releases](https://github.com/arpitariyan/to-do-app/releases) section. 

Current Version: **v1.2.0**

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Developer & Support

Developed and maintained by **Arpit Ariyan Maharana**. 
For support, inquiries, or feedback, please contact me at: `arpitariyanm@zohomail.in`.
