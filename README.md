# FlashFlow Frontend

This is the Next.js frontend for FlashFlow, migrated to interact with the NestJS backend API instead of direct Firestore.

## Getting Started

1. **Install Dependencies:**
   ```bash
   cd flashcard-fe
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env.local` file by copying the example:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your Firebase config values and the backend API URL.

3. **Run in Development:**
   ```bash
   npm run dev
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```
