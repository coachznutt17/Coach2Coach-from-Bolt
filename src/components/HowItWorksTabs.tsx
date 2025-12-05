import { useState } from 'react';
import { Search, ShoppingCart, FileCheck, UserPlus, Upload, DollarSign } from 'lucide-react';

interface HowItWorksTabsProps {
  defaultTab?: 'buyers' | 'coaches';
}

export default function HowItWorksTabs({ defaultTab = 'buyers' }: HowItWorksTabsProps) {
  const [activeTab, setActiveTab] = useState<'buyers' | 'coaches'>(defaultTab);

  const buyerSteps = [
    { icon: Search, title: 'Find a resource', description: 'Browse hundreds of coaching drills and playbooks' },
    { icon: ShoppingCart, title: 'Buy & download', description: 'Secure checkout, instant access to files' },
    { icon: FileCheck, title: 'Use in practice today', description: 'Print or use digitally with your team' },
  ];

  const coachSteps = [
    { icon: UserPlus, title: 'Create profile', description: 'Set up your coaching profile in minutes' },
    { icon: Upload, title: 'Upload PDF/DOCX', description: 'Share your drills, plays, and practice plans' },
    { icon: DollarSign, title: 'Get paid', description: 'Keep 85% of every sale, paid directly to you' },
  ];

  const steps = activeTab === 'buyers' ? buyerSteps : coachSteps;

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          How It Works
        </h2>

        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-gray-300 p-1">
            <button
              onClick={() => setActiveTab('buyers')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'buyers'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
              aria-pressed={activeTab === 'buyers'}
            >
              For Buyers
            </button>
            <button
              onClick={() => setActiveTab('coaches')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'coaches'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
              aria-pressed={activeTab === 'coaches'}
            >
              For Coaches
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <step.icon className="w-8 h-8" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {index + 1}. {step.title}
              </h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
