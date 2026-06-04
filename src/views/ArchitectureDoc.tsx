import Markdown from 'react-markdown';

const architectureMarkdown = `
# Valuxpert Multi-Tenant SaaS Architecture

This document outlines the master technical strategy for converting the Karmyug-Apple platforms into the Valuxpert Multi-Tenant SaaS Platform.

## 1. Database Changes
To ensure strict Data Isolation across all modules (Cases, HRMS, Payroll, etc.), we will implement a pool-based multi-tenancy model (shared database, isolated rows):
*   **Add \`tenant_id\`** to *every* relevant table/collection across the backend.
*   **Composite Keys:** Update Primary/Unique keys to include \`tenant_id\` (e.g., \`[tenant_id, email]\` must be unique, not just \`email\`).
*   **Super Admin Schema:** Create global tables (e.g., \`GlobalTenants\`, \`GlobalSubscriptions\`, \`SuperAdmins\`) that operate above the tenant context.

## 2. API & Backend Architecture Changes
*   **Tenant Middleware:** Intercepts every inbound request to extract the requested tenant context (via sub-domain, \`X-Tenant-ID\` header, or Auth token claims).
*   **Tenant Context Resolver:** Automatically injects the resolved \`tenant_id\` into the request object (\`req.tenantId\`).
*   **ORM/Query Scoping:** Global query filters in the ORM (e.g., Prisma extensions or Mongoose middlewares) to append \`WHERE tenant_id = req.tenantId\` on *every* database call.
*   **Super Admin APIs:** Independent API routes (e.g., \`/api/superadmin/*\`) with higher privilege checks to manage companies and subscriptions globally without tenant-scoping restrictions.

## 3. Frontend Architecture
*   **Separation of Concerns:**
    *   \`valuxpertSuperadmin\`: Standalone Next.js/React portal strictly for Super Admins.
    *   \`karmyug-Apple-Frontend\`: The Tenant portal, rendering dynamically based on feature flags fetched post-login.
*   **Feature-Based Rendering:** UI components must wrap in a \`<FeatureGuard feature="HRMS">\` wrapper that checks the tenant's active module flags before displaying.
*   **Auth Flow:** Centralized login service issuing JWTs with \`tenant_id\` and \`role\` payloads.

## 4. Automatic Company Setup Flow
When the Super Admin creates a company:
1.  System generates unique UUID for \`tenant_id\`.
2.  Creates the \`GlobalTenant\` record with selected Subscription Plan and Modules.
3.  Generates a \`Default Admin User\` record bound to that \`tenant_id\`.
4.  Generates a secure temporary password.
5.  Triggers async queue job to email the admin.
6.  Seeds tenant-specific default roles and settings in a batch transaction.

## 5. Security Considerations
*   **Strict RLS (Row Level Security):** If migrating to PostgreSQL, enable RLS policies keyed heavily against \`current_setting('app.current_tenant_id')\`.
*   **Cross-Tenant Leakage Prevention:** Automated testing enforcing that User A from Tenant 1 cannot hit \`/api/v1/cases/:id\` if that case belongs to Tenant 2, even with a valid JWT.

## 6. Migration Strategy
1.  **Phase 1 (Schema & Prep):** Add \`tenant_id\` to existing Karmyug databases. Set all existing records to a default \`legacy_tenant_id\`.
2.  **Phase 2 (Backend Overhaul):** Deploy Tenant Middleware and context resolvers. Update all API routes to honor the header. Test thoroughly against the legacy tenant context.
3.  **Phase 3 (Super Admin Dashboard):** Deploy \`valuxpertSuperadmin\` (this application) to manage the global contexts.
4.  **Phase 4 (Frontend Adapters):** Update Karmyug-Apple-Frontend to fetch and enforce layout via the Global Settings endpoint.
`;

export function ArchitectureDoc() {
  return (
    <div className="max-w-4xl max-h-screen overflow-y-auto pb-20 pr-6 custom-scrollbar">
      <div className="mb-8">
         <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-pine">Architecture & Implementation Plan</h1>
         <p className="text-pine/70 font-medium text-lg">Technical strategy for Valuxpert SaaS migration</p>
      </div>

      <div className="bg-butter-light border-2 border-pine/10 p-8 rounded-[2rem] shadow-sm">
        <div className="markdown-body prose prose-pine max-w-none 
          prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-pine 
          prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 
          prose-p:text-pine/80 prose-p:font-medium
          prose-li:text-pine/80 prose-li:font-medium
          prose-strong:text-pine">
          <Markdown>{architectureMarkdown}</Markdown>
        </div>
      </div>
    </div>
  );
}
