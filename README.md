# Restaurant & Canteen Food Contract Management System

A complete web-based system for managing food contracts between restaurant owners and customers. Tracks daily meals, handles payments, generates reports, and sends notifications.

## Features

- **Customer Management** – Register and manage customer information.
- **Food Contracts** – Create monthly, weekly, or daily food contracts.
- **Meal Tracking** – Record breakfast, lunch, and dinner consumption.
- **Payment Management** – Track payments, debts, and outstanding balances.
- **Food Packages** – Define meal packages and prices.
- **Attendance** – Track which customers eat each day.
- **Reports** – Generate daily, weekly, and monthly reports.
- **Notifications** – Notify customers about expired contracts and unpaid bills.
- **JWT Authentication** – Secure login with role-based access (admin, owner, employee).

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend  | React.js + Vite + Tailwind CSS |
| Backend   | NestJS (Node.js) |
| Database  | MongoDB (Mongoose) |
| Auth      | JWT (passport-jwt) |
| UI Icons  | lucide-react |

## Project Structure

```
Meal-contract-mgtSystem/
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── auth/             # JWT auth module
│   │   ├── users/            # User management
│   │   ├── customers/        # Customer CRUD
│   │   ├── contracts/        # Contract + MealPackage
│   │   ├── meal-tracking/    # Daily meal records
│   │   ├── payments/         # Payment records
│   │   ├── reports/          # Report generation
│   │   └── notifications/    # Notification system
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/       # Layout, shared UI
│   │   ├── pages/            # Route pages
│   │   ├── services/         # API client
│   │   └── context/          # Auth context
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Setup & Run

### Prerequisites

- Node.js 18+
- MongoDB running locally (or set `MONGODB_URI`)
- npm

### Backend

```bash
cd backend
npm install
npm run start:dev
```

API runs at `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

### Environment Variables (backend/.env)

```
PORT=3000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/meal_contract_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d
BCRYPT_SALT_ROUNDS=10
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| GET/POST | `/api/users` | List/create users |
| GET/POST | `/api/customers` | List/create customers |
| GET/POST | `/api/contracts` | List/create contracts |
| GET/POST | `/api/meal-tracking` | List/record meals |
| GET/POST | `/api/payments` | List/record payments |
| POST | `/api/reports/daily` | Generate daily report |
| POST | `/api/reports/weekly` | Generate weekly report |
| POST | `/api/reports/monthly` | Generate monthly report |
| GET/POST | `/api/notifications` | List/create notifications |

## Phases

- **Phase 1**: Customer registration, contracts, meal tracking ✅
- **Phase 2**: Payments, debts, reports, notifications ✅
- **Phase 3**: Food supplier contracts, inventory, QR-code scanning (future)

## License

MIT