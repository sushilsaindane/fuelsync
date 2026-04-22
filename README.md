# FuelSync 🏍️

**FuelSync** is a cross-platform mobile solution born out of necessity. This project was developed as a "digital dashboard" for a friend whose motorcycle speedometer and fuel gauge had failed, leaving them without critical trip data.

## 📖 The Story
The idea for FuelSync started when a friend's bike instrumentation stopped working. Suddenly, they had no way of knowing their speed, how far they had traveled, or—most importantly—when they were about to run out of gas. 

I developed this app as a temporary but robust fix. By leveraging GPS data and custom fuel-burn algorithms, FuelSync provides real-time speed tracking, range estimation, and historical fuel logging to ensure that a mechanical failure doesn't lead to being stranded.

## ✨ Key Features
- **GPS Dashboard:** Real-time speed and trip distance tracking using Mapbox GL.
- **Predictive Refill Logic:** Calculates expected refill dates based on current fuel levels and average consumption patterns.
- **Fuel History:** A comprehensive log of past refills to monitor vehicle efficiency and cost over time.
- **Smart Notifications:** Automated alerts when fuel levels drop below a safe threshold, utilizing Capacitor Local Notifications.
- **Cloud Sync:** Firebase integration for secure data persistence across devices.

## 🛠️ Tech Stack
- **Frontend:** React.js, Tailwind CSS, Lucide Icons
- **Build Tool:** Vite
- **Mobile Bridge:** Ionic Capacitor (Android)
- **Mapping:** Mapbox GL JS
- **Backend/DB:** Firebase Firestore & Authentication

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Android Studio (for mobile deployment)

### Installation
1. Clone the repo:
   git clone https://github.com/sushilsaindane/fuelsync.git
   cd fuelsync

2. Install dependencies:
   npm install

3. Environment Variables:
   Create a .env file in the root directory and add your credentials:
   VITE_MAPBOX_TOKEN=your_mapbox_token
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   VITE_FIREBASE_MEASUREMENT_ID=

4. Run Web Version:
   npm run dev

5. Build for Android:
   # Build the web assets
   npm run build
   
   # Sync with the Android project
   npx cap sync android

## 📱 Mobile Deployment
To run this on a physical device, open the android folder in Android Studio and use the Run command. The app is optimized for high-visibility use on a phone mount, featuring a clean "Fuel History" section and an intuitive interface designed for quick updates on the go.

---
Developed with ❤️ by [Sushil Saindane](https://github.com/sushilsaindane)
