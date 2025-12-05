import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

const ANNOUNCEMENT_KEY = 'announcement_dismissed';

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(ANNOUNCEMENT_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  function handleDismiss() {
    localStorage.setItem(ANNOUNCEMENT_KEY, 'true');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="bg-emerald-600 text-white py-2 px-4 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-center text-center">
        <p className="text-sm font-medium">
          <span className="font-semibold">New:</span> Sell your resources on Coach2Coach — creators keep 85%.{' '}
          <Link to="/become-seller" className="underline hover:text-emerald-100">
            Learn more
          </Link>
        </p>
        <button
          onClick={handleDismiss}
          className="absolute right-4 p-1 hover:bg-emerald-700 rounded transition-colors"
          aria-label="Dismiss announcement"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
