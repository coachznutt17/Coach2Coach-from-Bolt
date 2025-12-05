import { Users, FileText, ShieldCheck, Download } from 'lucide-react';

export default function TrustBar() {
  const stats = [
    { icon: Users, label: '20+ Creators', ariaLabel: '20 plus creators on platform' },
    { icon: FileText, label: 'Hundreds of drills', ariaLabel: 'Hundreds of drill resources available' },
    { icon: ShieldCheck, label: 'Secure checkout', ariaLabel: 'Secure payment checkout' },
    { icon: Download, label: 'Instant downloads', ariaLabel: 'Instant file downloads' },
  ];

  return (
    <div className="bg-gray-50 border-y border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center"
              aria-label={stat.ariaLabel}
            >
              <stat.icon className="w-8 h-8 text-emerald-600 mb-2" aria-hidden="true" />
              <span className="text-sm font-medium text-gray-900">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
