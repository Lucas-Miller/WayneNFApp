// routes/__root.tsx

import { createRootRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: Outlet,
  notFoundComponent: () => (
    <div className="page">
      <div className="card page-card">
        <h2>Page not found</h2>
        <Link to="/" className="btn btn-primary">
          Back to map
        </Link>
      </div>
    </div>
  ),
});
