# 🌍 TravelSaathi

TravelSaathi is a **solo travel companion finder** that helps travelers connect with like-minded people planning similar trips. Users can create travel plans, discover compatible travel buddies based on destination and travel dates, and communicate securely through the platform. The application aims to make solo travel safer, more social, and more enjoyable.

---

## ✨ Features

### 🔐 Authentication

* Email & Password Registration/Login
* Google OAuth Login
* JWT-based Authentication
* Protected Routes
* Forgot Password with OTP Verification
* Secure Password Hashing

### 👤 User Profile

* Create and update profile
* Upload profile picture
* Manage personal details
* View travel history

### ✈️ Trip Management

* Create new trips
* Delete trips
* View upcoming trips
* Search trips by destination
* View trip details

### 🤝 Travel Buddy Matching

* Find travelers with similar destinations
* Match users based on travel dates
* Browse compatible travel companions
* View traveler profiles before connecting

### 💬 Communication

* Send travel requests
* Accept or reject requests
* In-app messaging between matched travelers

### 🌦️ Weather Information

* View weather forecasts for destinations
* Weather data integrated using external Weather API

### 🔒 Security

* JWT Authentication
* Password hashing with bcrypt
* Protected backend APIs

### 📱 Responsive Design

* Mobile-friendly interface
* Responsive layouts using React
* Modern and intuitive UI

---

# 🛠 Tech Stack

## Frontend

* React.js
* Vite
* React Router
* Axios
* CSS

## Backend

* Node.js
* Express.js
* JWT Authentication
* bcrypt
* Nodemailer

## Database

* Google Firebase Cloud Firestore

## APIs

* Google OAuth
* Weather API
* Random.org API (OTP generation)

## Deployment

* Render

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/divya280904/TravelSaathi

cd TravelSaathi
```

---

## 2. Install Dependencies

This project uses **npm workspaces**, allowing you to install dependencies for the root, backend, and frontend with a single command.

From the project root directory, run:

```bash
npm run install:all
```

This command installs:

- Root project dependencies
- Backend dependencies
- Frontend dependencies

Alternatively, you can install them manually:

```bash
npm install
npm install --workspace=backend
npm install --workspace=frontend
```

---

## 3.🔥 Firebase Setup

## Create Firebase Project

1. Open Firebase Console.
2. Create a new project.
3. Enable Cloud Firestore.
4. Generate a Firebase Service Account Key.
5. Download the JSON key.
6. Store it securely inside the backend project.
7. Do **not** commit the credentials file to GitHub.

---

## Firestore Security Rules (Development)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if true;
    }

    match /trips/{tripId} {
      allow read, write: if true;
    }

    match /buddies/{buddyId} {
      allow read, write: if true;
    }

    match /messages/{messageId} {
      allow read, write: if true;
    }
  }
}
```

> **Note:** These rules are for development only. Restrict access appropriately before deploying to production.

---

# ⚙️ Environment Variables

Create a `.env` file inside the root directory.

Copy `.env.example` file and replace `****` with your credentials.

For the frontend:

Create a `.env` file inside the frontend directory.

Copy `.env.example` file from frontend directory and replace `****` with your credentials.

---

# ▶️ Running the Application

Start both the backend and frontend simultaneously:

```bash
npm run dev
```

This will start:

- **Backend:** http://localhost:5000
- **Frontend:** http://localhost:5173

You can also start them individually.

### Start Backend

```bash
npm run dev:backend
```

### Start Frontend

```bash
npm run dev:frontend
```

---

## 👩‍💻 Author

**Divya Gupta**

If you found this project useful, consider giving it a ⭐ on GitHub!