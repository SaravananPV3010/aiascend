# PillMate Documentation

## Overview
PillMate is an intelligent prescription and medication management application built with Next.js. It simplifies the process of tracking medications by allowing users to upload prescriptions (images), which are then analyzed using Google's Gemini Vision API. The application extracts key details—such as medication names, dosages, frequencies, and food timing requirements—and presents them in an easy-to-use digital dashboard.

## Table of Contents
1. [Key Features](#key-features)
2. [Tech Stack](#tech-stack)
3. [Project Architecture](#project-architecture)
4. [Core Workflows](#core-workflows)
5. [Getting Started](#getting-started)
6. [Best Practices & Design Guidelines](#best-practices--design-guidelines)

---

## Key Features

- **Automated Prescription Analysis:** Upload prescription images and let Gemini Vision AI automatically extract medication details.
- **Manual Medication Entry:** A fallback mechanism allowing users to manually add and edit their medications.
- **Smart Scheduling & Tracking:** Organizes medications by time of day (Morning, Afternoon, Night) and dietary restrictions (Before Food, After Food).
- **Safety Checks:** Automatically checks for potential contraindications or safety warnings between prescribed medications.
- **Modern, Responsive UI:** Built with Tailwind CSS and Framer Motion for a sleek, interactive, and accessible user experience.
- **Secure Authentication & Storage:** Integrated with Firebase for secure user management and personalized data storage.

---

## Tech Stack

- **Framework:** [Next.js 15+ (App Router)](https://nextjs.org/)
- **Frontend Library:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **AI Integration:** [Google Generative AI (Gemini Vision)](https://ai.google.dev/)
- **Backend/Database/Auth:** [Firebase](https://firebase.google.com/) & [Firebase Admin](https://firebase.google.com/docs/admin/setup)
- **Language:** TypeScript

---

## Project Architecture

The repository is structured around the Next.js App Router paradigm:

```text
pillmate/
├── app/
│   ├── api/          # Next.js API Routes (e.g., /api/analyze for Gemini Integration)
│   ├── medications/  # Dashboard for managing and filtering medications
│   ├── upload/       # Interface for uploading prescriptions
│   ├── layout.tsx    # Root application layout
│   └── globals.css   # Global Tailwind CSS configurations
├── components/
│   ├── ui/           # Reusable UI components (buttons, navbars, cards)
│   └── ...           # Feature-specific React components
├── lib/
│   └── utils.ts      # Shared utilities (e.g., Tailwind class merging)
├── public/           # Static assets (images, icons)
├── .env              # Environment Variables
├── next.config.ts    # Next.js configuration
├── tailwind.config.ts# Tailwind design tokens and plugins
└── package.json      # Dependencies and scripts
```

---

## Core Workflows

### 1. Prescription Upload & Analysis
1. User navigates to the `/upload` route and uploads an image.
2. The image is processed and sent to the `/api/analyze` internal API route.
3. The API invokes **Google Gemini Vision** with a structured prompt, instructing the model to return JSON containing medication details.
4. The frontend receives the JSON, parsing it into the user's medication state.

### 2. Medication Management Setup
1. Located at `/medications`.
2. Medications can be filtered by `Text Search`, `Sort Order`, `Timing` (Morning, Afternoon, Night), and `Food Requirement` (Before Food, After Food).
3. The UI presents visually distinct cards for each medication, highlighting "What it does" and "Why timing matters".
4. Users have access to a "Safety Check" modal that evaluates potential drug interactions.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase Project setup
- Google Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd pillmate
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Ensure you have a `.env` file in the root directory. You will need variables for Firebase and the Google Generative AI SDK:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   # Add Firebase variables as needed
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3001` to view the application.

---

## Best Practices & Design Guidelines

- **UI/UX Consistency:** Always use standard Tailwind utility classes provided in the setup. Stick safely to defined tokens (`font-fraunces`, `font-jakarta`, custom colors like `bg-sage`, `text-stone-*`).
- **Component Modularity:** Place generic UI elements (navbars, custom buttons) in `components/ui` and feature-specific components inside their respective `app/<feature>` folders.
- **Type Safety:** Heavily utilize TypeScript interfaces for the AI JSON responses since interacting with LLMs can yield unpredictable structures. Always implement fallback parsing.
- **Client/Server Boundaries:** Ensure data fetching and secure API calls (like invoking Gemini) happen on the server (`/api` routes or Server Actions) so API keys remain secure. Keep interactivity components explicitly marked with `'use client'`.

---
*Generated for the PillMate Repository*
