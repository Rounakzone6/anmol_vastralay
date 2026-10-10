# Anmol Vastralay - E-Commerce Platform

Welcome to the **Anmol Vastralay** repository! This is a modern, full-stack e-commerce platform built for a premium ethnic and western fashion store located in Gopalganj, Bihar.

This repository is structured as a monorepo containing three independent layers: the Storefront (Frontend), the Admin Dashboard, and the Backend API.

---

## 🏗️ Architecture & Tech Stack

This project uses a highly scalable, type-safe stack:

1. **Storefront (`anmol-frontend`)**
   - **Framework:** Next.js (React)
   - **Styling:** Tailwind CSS
   - **Data Fetching:** tRPC React Query
   - **AI:** Vercel AI SDK (integrated with Google's Gemini Pro for RAG Chatbot)
   - **Runs on:** `http://localhost:3000`

2. **Admin Dashboard (`anmol-admin`)**
   - **Framework:** Next.js (React)
   - **Styling:** Tailwind CSS
   - **Data Fetching:** tRPC React Query
   - **Runs on:** `http://localhost:3002`

3. **Backend API (`anmol-backend`)**
   - **Framework:** NestJS
   - **Database:** PostgreSQL via Prisma ORM
   - **API Layer:** tRPC Server (provides strict end-to-end type safety to the frontends)
   - **Authentication:** JWT & Passport
   - **Media:** Cloudinary (for image uploads)
   - **Runs on:** `http://localhost:3001`

---

## 🚀 Getting Started

To run this entire stack locally, you will need Node.js and PostgreSQL installed.

### 1. Database Setup
Ensure you have a PostgreSQL server running locally. Create a database named `anmol_db`.

### 2. Environment Variables
You must set up `.env` files in all three directories. 

**`anmol-backend/.env`**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/anmol_db?schema=public"
PORT=3001
JWT_SECRET=your_super_secret_jwt_key
ADMIN_EMAIL=admin@anmol.com
ADMIN_PASSWORD=securepassword
```

**`anmol-frontend/.env`**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/trpc
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

**`anmol-admin/.env`**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/trpc
```

### 3. Running the Backend
Open a terminal and run:
```bash
cd anmol-backend
npm install
npx prisma migrate dev
npm run start:dev
```

### 4. Running the Frontend
Open a new terminal and run:
```bash
cd anmol-frontend
npm install
npm run dev
```

### Google Sign-In / Sign-Up Setup

Google authentication is available on `/login` and `/register`. Create a
**Web application** OAuth client in the
[Google Cloud Console](https://console.cloud.google.com/apis/credentials), then
configure the same client ID in both environments:

**`anmol-frontend/.env`**
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

**`anmol-backend/.env`**
```env
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

For local development, add `http://localhost:3000` to the OAuth client's
**Authorized JavaScript origins**. Add the deployed storefront origin as well
when deploying. Restart both the frontend and backend after changing
environment variables.

### 5. Running the Admin Dashboard
Open a third terminal and run:
```bash
cd anmol-admin
npm install
npm run dev
```

---

## 🌟 Key Features

* **RAG Customer Care AI:** The storefront features a smart floating chatbot powered by Gemini 1.5 Pro. It has secure access to the backend database via custom tools to autonomously fetch live order details for customers based on their Order ID.
* **AI-Powered CRM & Helpdesk:** A bespoke CRM system is built into the Admin Panel featuring:
  * **Abandoned Cart Recovery:** Automatically reminds users via WhatsApp after 1 hour using background BullMQ jobs.
  * **Smart Segmentation:** Calculates Lifetime Value (LTV) to segment users into VIP, Regular, Dormant, and New.
  * **Bulk Broadcasting:** Admins can send targeted WhatsApp campaigns to segments. Includes smart anti-ban delay queuing.
  * **AI Handoff Ticketing:** When the AI chatbot detects an angry customer or a complex issue, it escalates the conversation to an Admin Inbox where humans can take over and reply directly via WhatsApp.
* **End-to-End Type Safety:** Because the backend uses tRPC, the frontends instantly know the exact data structure of products, users, and orders without needing manual TypeScript interfaces.
* **Infinite Scroll:** The collections page dynamically loads products as the user scrolls, keeping initial page load lightning fast.
* **Mobile-First Responsive Design:** Every page and component smoothly adapts to phones, tablets, and massive 4K monitors using fluid Tailwind breakpoints.
* **Secure Auth:** JWT-based authentication for customers and admins.
* **Optimized & Clean Codebase:** The entire repository has been deeply scanned via strict static analysis tools (like Knip) to guarantee 100% usage of all dependencies, exports, and files.

---

## 🌍 Deployment
This codebase is completely deployment-ready.
- **Frontend & Admin:** Deploy directly to [Vercel](https://vercel.com).
- **Backend:** Deploy the NestJS server on [Railway.app](https://railway.app) or another Node.js host.
- **Database:** Use a persistent hosted PostgreSQL provider such as [Neon](https://neon.tech). Copy its pooled connection URI into `DATABASE_URL`, optionally copy Neon’s direct (non-pooler) URI into `DIRECT_DATABASE_URL` for migrations, and set `DATABASE_SSL=true` in the backend environment. A local `localhost` URI only works on the same machine and cannot be used by a public deployment.
- Configure `FRONTEND_URL` and `ADMIN_URL` on the backend to accept traffic from your Vercel domains.
