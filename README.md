# Route & Vendor Management System (tRPC, Prisma, Express, React)

This is a web application for managing routes, vendors, items, and billing. It is built with a modern, full-stack TypeScript architecture.

## Tech Stack

- **Frontend**: [React](https://reactjs.org/) (with Vite)
- **Backend**: [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/)
- **API**: [tRPC](https://trpc.io/)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [SQLite](https://www.sqlite.org/index.html)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: Custom-built components

## Features

-   **Route Management**: Create and manage delivery or sales routes.
-   **Vendor Management**: Add vendors to specific routes, including contact and address details.
-   **Item Management**: Manage a list of items with prices and GST details.
-   **Billing**: Create bills for vendors with multiple items.
-   **PDF Generation**: Download individual bills and daily summaries as PDFs.

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/en/download/) (v18 or later)
-   [npm](https://www.npmjs.com/get-npm)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    cd frontend && npm install
    cd ../backend && npm install
    ```

3.  **Set up the database:**
    -   The `backend/prisma/dev.db` file will be created automatically.
    -   Apply the schema to the database:
        ```bash
        cd backend
        npx prisma db push
        ```

4.  **Set up environment variables:**
    -   The `.env` file is already in the `backend/` directory.
    -   It contains the database configuration:
        ```
        DATABASE_URL="file:./prisma/dev.db"
        ```

### Running the Application

To run both the frontend and backend servers in development mode:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:4000`.

## Scripts

-   `npm run dev`: Starts both frontend and backend servers in development mode.
-   `npm run build`: Builds the frontend and compiles the backend TypeScript code.
-   `npm run lint`: Lints the code in both the frontend and backend.

## Project Structure

```
route_and_vendor_management_system_9czcki/
├── frontend/              # React frontend
│   ├── src/              # Source code
│   ├── types/            # TypeScript type definitions
│   └── package.json      # Frontend dependencies
├── backend/              # Node.js backend
│   ├── server/           # Server code
│   ├── prisma/           # Database schema and files
│   ├── .env              # Environment variables
│   └── package.json      # Backend dependencies
└── package.json          # Root package.json with dev scripts
```
