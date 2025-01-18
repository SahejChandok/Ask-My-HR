import React from 'react';
import { Book, Clock, DollarSign, MapPin, Moon, Calendar } from 'lucide-react';

export function ShiftRulesKnowledgeBase() {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center mb-4">
          <Book className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Shift Rules Knowledge Base</h3>
        </div>

        <div className="prose prose-sm max-w-none">
          {/* Time Rules */}
          <div className="mb-8">
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 text-gray-400 mr-2" />
              <h4 className="text-base font-medium text-gray-900 m-0">Time Rules</h4>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium mb-2">Standard Hours</h5>
              <ul className="list-disc list-inside mb-4">
                <li>Daily: Default 8 hours</li>
                <li>Weekly: Default 40 hours</li>
                <li>Fortnightly: Default 80 hours</li>
              </ul>

              <h5 className="font-medium mb-2">Break Rules</h5>
              <ul className="list-disc list-inside">
                <li>Minimum Break: 30 minutes</li>
                <li>Break Frequency: Every 4 hours</li>
                <li>Maximum Work Before Break: 5 hours</li>
                <li>Paid/Unpaid Breaks: Configurable per industry</li>
              </ul>
            </div>
          </div>

          {/* Rate Multipliers */}
          <div className="mb-8">
            <div className="flex items-center mb-2">
              <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
              <h4 className="text-base font-medium text-gray-900 m-0">Rate Multipliers</h4>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium mb-2">Overtime Rates</h5>
              <ul className="list-disc list-inside mb-4">
                <li>First Tier (Rate1): 1.5x for first 4 hours</li>
                <li>Second Tier (Rate2): 2.0x for additional hours</li>
                <li>Threshold: 4 hours before Rate2 applies</li>
              </ul>

              <h5 className="font-medium mb-2">Weekend Rates</h5>
              <ul className="list-disc list-inside mb-4">
                <li>Saturday: 1.25x base rate</li>
                <li>Sunday: 1.5x base rate</li>
                <li>Applies automatically for work on these days</li>
              </ul>

              <h5 className="font-medium mb-2">Public Holiday Rates</h5>
              <ul className="list-disc list-inside">
                <li>Standard Rate: 2.0x base rate</li>
                <li>Alternative Holiday (Day in Lieu): Yes if worked</li>
                <li>Regional Holidays: Location-specific rates apply</li>
              </ul>
            </div>
          </div>

          {/* Night Shift Rules */}
          <div className="mb-8">
            <div className="flex items-center mb-2">
              <Moon className="w-4 h-4 text-gray-400 mr-2" />
              <h4 className="text-base font-medium text-gray-900 m-0">Night Shift Rules</h4>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium mb-2">Night Shift Rates</h5>
              <ul className="list-disc list-inside mb-4">
                <li>Base Rate: 1.15x standard rate</li>
                <li>Hours: Typically 22:00 to 06:00</li>
                <li>Loading Allowance: $25.00</li>
                <li>Meal Allowance: $15.00</li>
              </ul>

              <h5 className="font-medium mb-2">Additional Benefits</h5>
              <ul className="list-disc list-inside">
                <li>Additional rest breaks</li>
                <li>Minimum 11 hours between shifts</li>
                <li>Transport allowance may apply</li>
              </ul>
            </div>
          </div>

          {/* Location Rules */}
          <div className="mb-8">
            <div className="flex items-center mb-2">
              <MapPin className="w-4 h-4 text-gray-400 mr-2" />
              <h4 className="text-base font-medium text-gray-900 m-0">Location-Specific Rules</h4>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium mb-2">Auckland</h5>
              <ul className="list-disc list-inside mb-4">
                <li>Anniversary Day: Public holiday rates apply</li>
                <li>Waitangi Day: Public holiday rates apply</li>
                <li>Additional night shift allowance: +$5.00</li>
              </ul>

              <h5 className="font-medium mb-2">Wellington</h5>
              <ul className="list-disc list-inside">
                <li>Anniversary Day: Public holiday rates apply</li>
                <li>Higher transport allowance for CBD locations</li>
              </ul>
            </div>
          </div>

          {/* Break Scheduling */}
          <div>
            <div className="flex items-center mb-2">
              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
              <h4 className="text-base font-medium text-gray-900 m-0">Break Scheduling Examples</h4>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium mb-2">Healthcare</h5>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
{`{
  breakRules: {
    minimumBreak: 30,
    paidBreak: true,
    additionalBreaks: [
      { hours: 6, duration: 30, paid: true },
      { hours: 10, duration: 15, paid: true }
    ]
  }
}`}
              </pre>

              <h5 className="font-medium mb-2 mt-4">Manufacturing</h5>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
{`{
  breakRules: {
    minimumBreak: 30,
    paidBreak: false,
    additionalBreaks: [
      { hours: 4, duration: 15, paid: true }
    ]
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}