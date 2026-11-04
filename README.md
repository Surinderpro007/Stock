# StockApp — virtual stock market

Next.js authentication app extended into a **paper-trading** market for learning only. No real money is involved.

## Setup

1. Copy environment values:

```bash
cp .env.example .env.local
```

On Windows PowerShell: `Copy-Item .env.example .env.local`

2. Fill in at least `MONGODB_URI` and `JWT_SECRET`. Use a MongoDB Atlas replica set so buy/sell transactions work.

3. Install and seed:

```bash
npm install
npm run seed:stocks
npm run seed:wallets
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

New users get a virtual wallet after email verification or first Google login. `npm run seed:wallets` backfills existing accounts with `STARTING_BALANCE` (default ₹10,000). Opening `/api/portfolio` also creates a missing wallet.

## Environment variables

| Name | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Signs the httpOnly `token` cookie |
| `ADMIN_EMAIL` | no | Email treated as super admin |
| `STARTING_BALANCE` | no | Virtual cash for new wallets (default `10000`) |
| `MARKET_DATA_PROVIDER` | no | `simulated` today; swap point for a live API |
| `TICK_MAX_PERCENT` | no | Max random move on a market tick (default `0.4`) |
| `CURRENCY` | no | Display currency (default `INR`) |
| `CRON_SECRET` | no | Bearer token for `POST /api/cron/market-tick` |

Also keep any existing email/Google auth variables you already use.

## Who can see what

- **Guest:** public home and a limited stock list (symbol, name, current price). Clicking a stock, chart, portfolio, buy, or sell shows **Please log in to get full access**. The public API does not return details, history, or portfolio data.
- **Logged-in user:** full quotes, charts, buy/sell, own portfolio and transactions.
- **Admin:** everything a user can do, plus the existing admin panel (users, roles, audit logs) and a **Trades** overview.

## Folder structure

```text
config/                     db.js, trading.js
models/                     User, PendingUser, AuditLog, Stock, PriceHistory,
                            Wallet, Holding, Transaction
controllers/                auth, profile, admin, stock, portfolio, adminMarket
services/market/            Simulated quotes/history (swap here for a live API)
services/walletService.js   Create ₹10,000 wallets
lib/                        validation, email, money, auth, tradeMath
scripts/                    seedStocks.js, ensureWallets.js
tests/                      buy/sell, balance, access control
app/api/                    Auth (unchanged) + stocks, portfolio, admin/trades
app/stocks/                 List and detail + charts
app/portfolio/              Holdings and P&L
app/transactions/           Trade history
app/admin/                  Existing users/roles/audit + Trades tab
app/components/             Navbar, stocks, portfolio, LoginRequired
app/hooks/                  useStocks, useStockDetail, usePortfolio
middleware.ts               Existing dashboard/profile/admin/login guards
```

To use a real market feed later, add a provider next to `services/market/simulatedProvider.js` and set `MARKET_DATA_PROVIDER`. Controllers call `getMarketDataProvider()` only.

## Pages

| Path | Access |
|---|---|
| `/` | Public landing + limited stock snapshot |
| `/login`, `/register` | Auth (existing) |
| `/dashboard`, `/profile` | Logged in (existing) |
| `/stocks` | List; guests see limited rows and a login prompt on click |
| `/stocks/[symbol]` | Logged in: details, chart, buy/sell |
| `/portfolio` | Own wallet and holdings |
| `/transactions` | Own buy/sell history |
| `/admin` | Admins only: users, deleted, audit log, trades |

Navbar for signed-in users: Home, Stocks, Portfolio, Admin (admins), Logout.

## API list

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/stocks` | Public | `q`, `sortBy` (`symbol` \| `name` \| `price` \| `change`), `order`, `limit`. Guests: symbol, name, price. Logged-in: also day change. |
| GET | `/api/stocks/[symbol]` | Logged in | Full quote. Guest: `401` `Please log in to get full access` |
| GET | `/api/stocks/[symbol]/history?range=` | Logged in | `1d`, `1w`, `1m`, `3m`, `1y` |
| GET | `/api/portfolio` | Logged in | Balance, invested, current value, P&L, holdings |
| POST | `/api/portfolio/buy` | Logged in | `{ "symbol", "quantity" }`. Server uses `currentPrice`. |
| POST | `/api/portfolio/sell` | Logged in | Same body. Fails if not enough shares. |
| GET | `/api/transactions` | Logged in | `page`, `limit`, `type` |
| GET | `/api/admin/users` | Admin | Existing user list |
| GET | `/api/admin/trades` | Admin | Trade counts, volume, recent trades |
| POST | `/api/cron/market-tick` | `Authorization: Bearer CRON_SECRET` | Optional random price tick |

Existing auth routes (`/api/login`, `/api/register`, `/api/profile`, Google, OTP, admin user actions) are unchanged.

Buy and sell run in a MongoDB transaction so wallet, holdings, and the trade row stay in sync. The client cannot set the price.

## Scripts

```bash
npm run dev           # development
npm run build         # production build
npm start             # production server
npm run lint          # eslint
npm test              # buy/sell, balance, access-control tests
npm run seed:stocks   # 20 Indian stocks + history
npm run seed:wallets  # wallets for users who do not have one
```

Optional live tick:

```bash
curl -X POST http://localhost:3000/api/cron/market-tick -H "Authorization: Bearer YOUR_CRON_SECRET"
```
