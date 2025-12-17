# Social Publisher

A cross-platform social media management application for scheduling and publishing posts to multiple social media platforms.

## Project Structure

```
├── backend/          # Python FastAPI backend
├── mobile/           # React Native/Expo mobile app (iOS & Android)
├── web/              # React web frontend (Vite)
└── README.md
```

## Features

- 📱 **Cross-platform** - Web, iOS, and Android apps
- 🔐 **Authentication** - Email/password and OAuth (Google, Facebook)
- 📊 **Dashboard** - Analytics and performance tracking
- 📝 **Post Management** - Create, schedule, and publish posts
- 🔗 **Multi-platform** - Connect Facebook, Instagram, Twitter, LinkedIn, YouTube
- 👤 **User Profile** - Edit profile, change password, notification settings

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Configure your environment
python -m uvicorn main:app --reload
```

Backend runs at: http://localhost:8000

### Web App

```bash
cd web
npm install
npm run dev
```

Web app runs at: http://localhost:5173

### Mobile App

```bash
cd mobile
npm install
npm run start             # Start Expo dev server
npm run ios               # Run on iOS simulator
npm run android           # Run on Android emulator
npm run web               # Run in browser
```

## Environment Variables

### Backend (.env)

```env
SECRET_KEY=your-secret-key
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=social_publisher

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

### Web (.env)

```env
VITE_API_URL=http://localhost:8000
```

## Tech Stack

### Backend
- **FastAPI** - Python async web framework
- **MongoDB/Beanie** - Database and ODM
- **bcrypt** - Password hashing
- **PyJWT** - JSON Web Tokens

### Web
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation

### Mobile
- **React Native** - Cross-platform mobile
- **Expo** - Development platform
- **Expo Router** - File-based navigation
- **Expo Secure Store** - Token storage

## License

MIT
