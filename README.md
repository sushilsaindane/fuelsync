# FuelSync 🏍️

**FuelSync** is a high-performance mobile application built with React, Vite, and Capacitor. It was designed to solve a real-world problem: providing critical trip and fuel data for vehicles with broken instrumentation.

## 📖 The Story
The idea for FuelSync started when a friend's motorcycle speedometer and fuel sensor stopped working. Suddenly, they had no way of knowing their speed, how far they had traveled, or—most importantly—when they were about to run out of gas.

I developed this app as a "digital dashboard" fix. By leveraging GPS data and custom fuel-burn algorithms, FuelSync provides real-time range estimation and historical tracking, ensuring that a mechanical failure doesn't lead to being stranded on the side of the road.

## ✨ Key Features
- **GPS Dashboard:** Real-time speed and trip distance tracking using Mapbox GL.
- **Predictive Refill Logic:** Calculates expected refill dates based on current fuel levels and average consumption.
- **Fuel History:** A comprehensive log of past refills to monitor vehicle efficiency over time.
- **Smart Notifications:** Automated alerts when fuel levels drop below a safe threshold, built using Capacitor Local Notifications.
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
1. **Clone the repo:**
   ```bash
   git clone [https://github.com/sushilsaindane/fuelsync.git](https://github.com/sushilsaindane/fuelsync.git)
   cd fuelsync
