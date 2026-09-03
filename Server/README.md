# ⚡ LEETPULSE — Server (Backend API Engine)

This directory contains the Node.js + Express backend service, real-time WebSocket server, background synchronization engine, and MongoDB database models for **LeetPulse**.

## 🚀 Quick Start (Server)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configure `MONGODB_URI`, `JWT_SECRET`, `PORT`, and `SMTP` settings.

3. **Run Development Server**:
   ```bash
   npm run server
   ```

4. **Seed Demo Data**:
   ```bash
   npm run seed
   ```

For full system architecture, multi-tenant hierarchy docs, API endpoint references, and client setup instructions, refer to the main [Root README](../README.md).
