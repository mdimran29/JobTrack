import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const NotFoundPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas px-4 text-center">
    <p className="font-mono text-sm text-text-tertiary">404</p>
    <h1 className="font-display text-xl font-semibold text-text-primary">Page not found</h1>
    <p className="max-w-sm text-sm text-text-secondary">
      The page you're looking for doesn't exist or may have moved.
    </p>
    <Link to="/dashboard">
      <Button size="sm" className="mt-2">
        Back to dashboard
      </Button>
    </Link>
  </div>
);
