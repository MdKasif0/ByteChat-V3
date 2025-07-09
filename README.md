<p align="center">
  <img src="https://bytechat-v3.netlify.app/bytechat-logo.png" alt="ByteChat Logo" width="120"/>
</p>

<h1 align="center">ByteChat</h1>

<p align="center">
  A modern, real-time messaging application built with Next.js, Firebase, and WebRTC.
  <br />
  <a href="https://bytechat-v3.netlify.app/"><strong>View Live Demo »</strong></a>
</p>

---

## ✨ Features

- **Real-time Text Messaging:** Instant one-on-one and group chats with typing indicators, read receipts, emoji reactions, and file sharing.
- **HD Voice & Video Calls:** Crystal-clear, secure peer-to-peer calls powered by WebRTC.
- **AI Assistant:** An integrated AI chat bot to answer questions and assist users, powered by Google Gemini.
- **Status Updates:** Share ephemeral photo or video updates with your friends that disappear after 24 hours.
- **Secure Authentication:** Robust sign-in/sign-up with email/password and Google OAuth.
- **Customizable Profiles:** Personalize your experience with custom display names, usernames, and avatars.
- **Modern UI/UX:** A sleek, responsive, and premium interface with meticulously designed light and dark modes.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **Backend & Database:** [Firebase](https://firebase.google.com/) (Firestore, Authentication, Storage)
- **Real-time Communication:** [PeerJS](https://peerjs.com/) (WebRTC)
- **Generative AI:** [Google Genkit](https://firebase.google.com/docs/genkit)
- **Deployment:** [Netlify](https://www.netlify.com/)

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need to have Node.js (v18 or later) and npm/yarn installed on your machine.

### Installation

1.  **Clone the repository**
    ```sh
    git clone https://github.com/your-username/bytechat.git
    cd bytechat
    ```

2.  **Install dependencies**
    ```sh
    npm install
    ```

3.  **Set up Firebase**
    - Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    - Inside your project, enable **Firestore**, **Authentication** (with Email/Password and Google providers), and **Storage**.
    - Navigate to Project Settings > General, and under "Your apps", create a new Web App.
    - Copy the `firebaseConfig` object.
    - Navigate to Project Settings > Service accounts and click "Generate new private key" to download your service account JSON file.

4.  **Configure Environment Variables**
    - Create a file named `.env.local` in the root of your project. This file is ignored by Git and is safe for your secrets.
    - Populate it with your Firebase credentials from the previous steps.

    ```env
    # For client-side Firebase
    NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
    NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
    NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_WEB_PUSH_VAPID_KEY

    # For server-side Firebase (e.g., sending notifications)
    # Paste the entire content of your downloaded service account JSON file here.
    FIREBASE_SERVICE_ACCOUNT_JSON='{"type": "service_account", ...}'
    ```

5.  **Run the development server**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
