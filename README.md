# 🏥 Clinic Inventory Management System

A full-stack inventory management system built for medical clinics. Tracks medicines, supplies, orders, and suppliers — with real-time updates and smart reorder recommendations.

## ✨ Features

- **Dashboard** — Overview of stock levels, recent orders, and alerts
- **Inventory** — Add, edit, delete, and consume medicine/supply stock with live status tracking
- **Orders** — Manage purchase orders and track fulfillment
- **Suppliers** — Store supplier details and the products they offer
- **Recommendations** — Smart reorder suggestions for low-stock items, with live price scraping from online vendors
- **Reports** — Visual summaries of inventory health
- **Real-time updates** — All changes sync live across tabs via Socket.IO

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas (Mongoose) |
| Real-time | Socket.IO |
| Web Scraping | Puppeteer, Cheerio |

## 📁 Project Structure

```
inventory-management/
├── client/              # React frontend (Vite)
│   └── src/
│       ├── pages/       # Dashboard, Inventory, Orders, Suppliers, etc.
│       └── components/  # Navbar, Sidebar
├── server/              # Node.js + Express backend
│   ├── models/          # Mongoose schemas
│   ├── routes/          # REST API routes
│   └── utils/           # Web scraper
└── .gitignore
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account

### 1. Clone the repo
```bash
git clone https://github.com/vbs925/inventory-management.git
cd inventory-management
```

### 2. Set up the server
```bash
cd server
npm install
```

Create a `.env` file inside `server/`:
```
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=5001
```

Start the server:
```bash
npm start
```

### 3. Set up the client
```bash
cd client
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | Get all inventory items |
| POST | `/api/inventory` | Add new item |
| PUT | `/api/inventory/:id` | Update item |
| DELETE | `/api/inventory/:id` | Delete item |
| PUT | `/api/inventory/:id/consume` | Consume stock |
| GET | `/api/inventory/recommendations` | Get smart reorder suggestions |
| GET/POST | `/api/suppliers` | Manage suppliers |
| GET/POST | `/api/orders` | Manage orders |
| GET | `/api/dashboard` | Dashboard stats |

## 📄 License

MIT

---
*Built as a POC for Cortext Internship — March 2026*
