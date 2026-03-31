## 🛠 The Tech Stack

| Layer         | Technology               | Purpose                                                       |
| ------------- | ------------------------ | ------------------------------------------------------------- |
| **Framework** | **Next.js (App Router)** | React framework for routing, SSR, and Server Components.      |
| **API Layer** | **tRPC**                 | End-to-end typesafe APIs without GraphQL or REST boilerplate. |
| **ORM**       | **Prisma**               | Type-safe database client and schema management.              |
| **Database**  | **PostgreSQL**           | Relational database for persistent storage.                   |
| **Auth**      | **Auth.js (v5)**         | Secure authentication using GitHub OAuth.                     |
| **Styling**   | **Tailwind + shadcn/ui** | Utility-first CSS and re-usable accessible components.        |

---

## 🏗 System Data Flow

### 1. The Database Agent (Prisma + Postgres)

Prisma acts as the single source of truth.

- **Schema:** Defined in `prisma/schema.prisma`.
- **Migrations:** Run `npx prisma migrate dev` to sync changes to the Postgres instance.
- **Client:** Used exclusively within the **Server Layer** (tRPC routers or Server Actions).

### 2. The API Agent (tRPC)

tRPC bridges the gap between the server and the client.

- **Routers:** Defined in `src/server/api/routers`.
- **Procedures:** We use `publicProcedure` for open data and `protectedProcedure` for authenticated actions.
- **Validation:** All inputs are strictly validated using **Zod**.

### 3. The Auth Agent (Auth.js)

Handles the identity handshake with GitHub.

- **Provider:** GitHub OAuth.
- **Session:** Managed via a JWT or Database strategy (Prisma Adapter).
- **Integration:** The session is injected into the tRPC `context`, allowing procedures to check `ctx.session.user`.

### 4. The UI Agent (Next.js + shadcn/ui)

- **Server Components:** Fetch data via tRPC or direct Prisma calls for initial page loads.
- **Client Components:** Use the `api.resource.useQuery` hooks for interactive data and mutations.
- **Styling:** Components are built using Tailwind classes, following the `shadcn` design system for consistency.

---

## 🔐 Security Standards

1. **Server-Side Validation:** Never trust client-side data. Every tRPC mutation must use `.input(z.object({...}))`.
2. **Protected Routes:** Use the `protectedProcedure` middleware in tRPC to ensure only logged-in GitHub users can mutate data.
