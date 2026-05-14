# 👑 King of the Throne

**King of the Throne** is an innovative mobile application that combines a personal hygiene tracker with an engaging idle (clicker) game. Users can manage their "Bathroom Empire," compete in leaderboards, and track their habits to earn special in-game boosts.

## ✨ Key Features

### 🏰 Bathroom Empire (Idle Game)
* **Clicker Mechanics**: Tap the throne to generate coins.
* **Upgrades**: Invest in improvements like "Wet Wipes," "Bidet Attachment," or "Orbital Bidet" to increase your active and passive income.
* **Prestige**: Reset your progress in exchange for "Golden Plungers," which provide a permanent global earnings multiplier.
* **Offline Progress**: Earn resources even while away from the app for up to 8 hours.

### 💩 Poop Tracker & Boosts
* **Quick Log**: Easily record your sessions through the tracker interface.
* **Real-Life Boost**: Logging a real-life entry activates a **2x Poop Boost** multiplier for 1 hour in the game.
* **History**: View a full list of your records with timestamps, grouped by date.

### 🏆 Social Features & Levels
* **Leaderboards**: Compete in "All-Time," "Weekly," and "Legends" (Level-based) rankings.
* **Leveling System**: Progress from "Toilet Peasant" to "King of the Throne" by accumulating entries.
* **Badges**: Unlock achievements for reaching levels or special milestones like "Perfect Form" (Bristol Type 4).

### 🎨 Customization
* **Themes**: A variety of visual themes such as "Ocean Flush," "Royal Purple," and "Midnight Gold" unlock as you level up.
* **Avatars**: Choose from various emoji avatars or upload your own profile photo with built-in moderation.

## 🛠 Tech Stack

The project is built using the following technologies:
* **Frontend**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 54).
* **Language**: [TypeScript](https://www.typescriptlang.org/).
* **Backend**: [Supabase](https://supabase.com/) for Database, Auth, and File Storage.
* **State Management**: [Zustand](https://github.com/pmndrs/zustand) for managing game state, themes, and settings.
* **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS).
* **Navigation**: [Expo Router](https://expo.github.io/router) for file-based routing.

## 📁 Project Structure

* `/app` — Application routes and screens.
  * `/(auth)` — Login and registration screens.
  * `/(tabs)` — Main app sections (Empire, Log, Rankings, Squad).
* `/src/components` — Reusable UI components (banners, buttons, animations).
* `/src/constants` — Configurations for levels, themes, colors, and badges.
* `/src/store` — State management logic via Zustand.
* `/src/types` — TypeScript definitions and database interfaces.

## 🚀 Installation & Setup

1. **Clone the repository.**
2. **Install dependencies**:
   ```bash
   npm install
