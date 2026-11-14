# Restaurant & Canteen Food Contract Management System

A web-based system for monthly food subscriptions, student meal planning, actual serving records, customer payments, reports, and notifications.

## Features

- **Customer Management** – Register and manage customer information.
- **Food Contracts** – Create monthly, weekly, or daily food contracts.
- **Monthly Contracts** – Students pay a fixed subscription price that does not change with daily attendance.
- **Student Meal Selection** – Students choose eating or not eating for each meal and can update selections before configurable deadlines.
- **Food Menus** – Publish dated breakfast, lunch, and dinner menus with English, Afaan Oromo, and Amharic names.
- **Meal Preparation Summary** – Count expected meals, pending selections, and not-eating responses by date.
- **Serving Records** – Employees record meals served or no-shows separately from student plans.
- **Payment Management** – Track payments, debts, and outstanding balances.
- **Food Packages** – Define meal packages and prices.
- **Attendance** – Track which customers eat each day.
- **Reports** – Generate daily, weekly, and monthly reports.
- **Notifications** – Notify customers about expired contracts and unpaid bills.
- **JWT Authentication** – Secure login with role-based access (admin, owner, student, employee). Students and employees can self-register; the first owner is provisioned manually.
- **Role Dashboards** – Owners manage operations, employees record meals, and students view their own contracts, meals, and payments.

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

### Create the first owner account

Owner accounts are never created through public registration. Create the first owner manually from `backend/` by supplying credentials in the environment:

```bash
OWNER_EMAIL=owner@example.com OWNER_NAME="Restaurant Owner" OWNER_PASSWORD="change-this-password" npm run create:owner
```

The password is hashed before it is saved. Students and employees can register through the public registration page. Authenticated owners can provision further user accounts through the protected user-management API.

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
| POST | `/api/auth/register` | Public registration for students and employees only |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| GET/POST | `/api/users` | List/create users (authenticated; use a trusted admin process to provision admin/owner accounts) |
| GET/POST | `/api/customers` | List/create customers |
| GET/POST | `/api/contracts` | List/create contracts |
| GET/POST | `/api/contracts/packages` | List/create meal packages |
| GET | `/api/meal-tracking/servings/date/:date` | View actual serving records |
| GET/PUT | `/api/meal-tracking/me/selections` | Student's own daily selection |
| GET | `/api/meal-tracking/summary/:date` | Owner/employee preparation counts |
| GET/POST | `/api/meal-tracking/daily-menu` | View/publish daily menus |
| GET/POST | `/api/meal-tracking/menu-items` | View/create localized food items |
| GET/POST | `/api/payments` | List/record payments |
| POST | `/api/reports/daily` | Generate daily report |
| POST | `/api/reports/weekly` | Generate weekly report |
| POST | `/api/reports/monthly` | Generate monthly report |
| GET/POST | `/api/notifications` | List/create notifications |

## Development Roadmap

- **Phase 1**: Authentication, role dashboards, customer accounts, contracts, and meal tracking (in progress)
- **Phase 2**: Payments, debts, reports, and notifications (in progress)
- **Phase 3**: Food supplier contracts, inventory, QR-code scanning (planned)

## License

MIT
