import React from 'react';
import { Building2, Stethoscope, Factory, GraduationCap, Shield, Laptop } from 'lucide-react';
import { SHIFT_TEMPLATES } from '../../utils/shiftTemplates';

interface IndustryTemplateSelectProps {
  onSelect: (industry: string) => void;
}

export function IndustryTemplateSelect({ onSelect }: IndustryTemplateSelectProps) {
  const industries = [
    { id: 'healthcare', name: 'Healthcare', icon: Stethoscope, description: '24/7 healthcare operations with extended shifts' },
    { id: 'manufacturing', name: 'Manufacturing', icon: Factory, description: '24/7 manufacturing with rotating shifts' },
    { id: 'education', name: 'Education', icon: GraduationCap, description: 'Education sector with term-time patterns' },
    { id: 'security', name: 'Security', icon: Shield, description: '24/7 security services with flexible shifts' },
    { id: 'remote', name: 'Remote Work', icon: Laptop, description: 'Remote work with flexible hours' }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {industries.map(({ id, name, icon: Icon, description }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className="relative flex flex-col p-6 bg-white shadow-sm rounded-lg border border-gray-200 hover:border-indigo-500 transition-colors"
        >
          <div className="flex items-center mb-4">
            <Icon className="w-6 h-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">{name}</h3>
          </div>
          <p className="text-sm text-gray-500">{description}</p>
        </button>
      ))}
    </div>
  );
}