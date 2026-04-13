# 🛰️ Alert Emergency Response - Frontend

A sophisticated React-based dashboard designed for high-stakes emergency coordination, providing responders with real-time situational awareness and rapid-action tools.

## ✨ Key Features

- **Interactive SOS Trigger**: One-click emergency activation capturing precise geolocation, real-time weather, and custom messages.
- **Dynamic Situational Awareness**: Integrated weather widgets and location indicators for enhanced decision-making.
- **Relief Center Management**: Role-based dashboards for relief center in-charges to manage capacity, admissions, and supply requests.
- **Collection Center Logistics**: Specialized views for collection center leads to track deliveries and stock.
- **Responsive Management UI**: Built with Material UI (MUI) for a professional, consistent, and mission-ready interface.
- **Real-time Notifications**: Instant feedback via React Toastify for critical actions and updates.

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **State Management**: Redux Toolkit (RTK)
- **UI Framework**: Material UI (MUI)
- **Navigation**: React Router 6
- **HTTP Client**: Axios with centralized Instance/Interceptor management
- **Maps**: Leaflet (Data Grid visualization and location tracking)
- **Feedback**: React Toastify & Custom Spinners

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
# Backend API Location
REACT_APP_API_BASE_URL=http://localhost:5000

# Weather Integration (OpenWeather/Open-Meteo as applicable)
REACT_APP_WEATHER_API_KEY=your_key_here

# Agency Configuration
REACT_APP_AGENCY_KEY=agency/register?key=india
```

## 🛠️ Project Structure

- `src/api`: Centralized API services (SOS, Auth, Relief, Collection).
- `src/scenes`: Page-level components organized by functional area (Main, Admin, Relief, Collection).
- `src/store`: Redux slices and global state management.
- `src/types`: Centralized TypeScript interfaces for domain models and API responses.
- `src/hooks`: Custom React hooks for geolocation and state synchronization.

## 🚀 Installation & Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start
```

## 🔒 Security & Onboarding

- **Agency Key Protection**: Registration is protected by a mandatory Agency Key, ensuring only authorized responders can create accounts.
- **JWT Authorization**: Automatic token attachment via Axios interceptors for all protected API calls.

---
*Empowering emergency responders with reliable, real-time technology.*
