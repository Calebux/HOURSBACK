import { Link } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-brand-light flex flex-col items-center justify-center text-brand-dark px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-brand-dark flex items-center justify-center mb-6">
        <Clock className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-5xl font-bold mb-3">404</h1>
      <p className="text-xl font-semibold mb-2">Page not found</p>
      <p className="text-brand-dark/60 max-w-sm mb-8">
        This page doesn't exist. Let's get you back to saving time.
      </p>
      <Link to="/" className="flex items-center gap-2 bg-brand-dark text-white px-6 py-3 rounded-full font-medium hover:bg-brand-dark/90 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
    </div>
  );
}
