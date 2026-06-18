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
* **End-to-End Type Safety:** Because the backend uses tRPC, the frontends instantly know the exact data structure of products, users, and orders without needing manual TypeScript interfaces.
* **Infinite Scroll:** The collections page dynamically loads products as the user scrolls, keeping initial page load lightning fast.
* **Mobile-First Responsive Design:** Every page and component smoothly adapts to phones, tablets, and massive 4K monitors using fluid Tailwind breakpoints.
* **Secure Auth:** JWT-based authentication for customers and admins.

---

## 🌍 Deployment
This codebase is completely deployment-ready.
- **Frontend & Admin:** Deploy directly to [Vercel](https://vercel.com).
- **Backend & Database:** Deploy the NestJS server and provision a PostgreSQL database on [Railway.app](https://railway.app) or [Render](https://render.com). Ensure you configure the CORS environment variables (`FRONTEND_URL` and `ADMIN_URL`) on the backend to accept traffic from your Vercel domains!
