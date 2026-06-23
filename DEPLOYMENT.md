# Deployment Guide for NeoTrade

Congratulations on completing the entire platform! Now it's time to push NeoTrade to production. Since the application is split into a frontend and a backend, we will deploy them to their specialized hosting platforms: **Netlify for the Backend** and **Vercel for the Frontend**.

*Note: Since deployment requires logging into your personal hosting accounts via a browser, you must run these commands directly in your local terminal.*

## Step 1: Deploy the Backend to Netlify

Your backend is already pre-configured to run as a serverless Netlify function (thanks to `netlify/functions/api.ts` and `netlify.toml`).

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd "d:\New backend project\wallet-app\backend"
   ```
2. Install the Netlify CLI globally if you haven't already:
   ```bash
   npm install -g netlify-cli
   ```
3. Login to your Netlify account:
   ```bash
   netlify login
   ```
4. Deploy the backend:
   ```bash
   netlify deploy --prod
   ```
5. **Configure Environment Variables in Netlify**:
   Go to your Netlify Dashboard -> Site Settings -> Environment Variables. Add the following:
   - `DATABASE_URL` (Your Neon Postgres connection string)
   - `JWT_SECRET` (A strong random string for your JWT tokens)
   - `FRONTEND_URL` (We will update this to your Vercel URL later, for now you can set it to `*`)

*Take note of your deployed Netlify Live URL (e.g., `https://my-backend.netlify.app`). You will need this for the frontend!*

## Step 2: Deploy the Frontend to Vercel

Next.js applications deploy natively to Vercel with zero configuration.

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd "d:\New backend project\wallet-app\frontend"
   ```
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Run the Vercel deployment:
   ```bash
   vercel --prod
   ```
   *(You will be prompted to log in via your browser if you aren't already).*
4. When Vercel asks you to set up the project, just hit **Enter** to accept the defaults (it will auto-detect Next.js).
5. **Configure Environment Variables in Vercel**:
   Go to your Vercel Dashboard -> Project Settings -> Environment Variables. Add:
   - `NEXT_PUBLIC_API_URL` (Set this to your newly deployed Netlify backend URL, e.g., `https://my-backend.netlify.app`)

## Step 3: Final Linkage

Once the frontend is deployed on Vercel, copy its live URL (e.g., `https://neotrade-frontend.vercel.app`).
Go back to your Netlify Dashboard and update the backend's `FRONTEND_URL` environment variable to match this Vercel URL. This ensures secure CORS communication between your two live domains!

Your platform is now live! 🚀
