import React from 'react';
import { LeaveRequest } from '../../types';
import { formatDisplayDate } from '../../utils/dateUtils';
import { Calendar, Clock, User } from 'lucide-react';

interface LeaveCalendarProps {
  requests: LeaveRequest[];
  onRequestClick: (request: LeaveRequest) => void;
}

export function LeaveCalendar({ requests, onRequestClick }: LeaveCalendarProps) {
  // Group requests by month
  const groupedRequests = requests.reduce((acc, request) => {
    const month = new Date(request.start_date).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(request);
    return acc;
  }, {} as Record<string, LeaveRequest[]>);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Leave Calendar</h3>
        
        {Object.entries(groupedRequests).map(([month, monthRequests]) => (
          <div key={month} className="mb-8">
            <h4 className="text-md font-medium text-gray-700 mb-4">{month}</h4>
            <div className="space-y-4">
              {monthRequests.map((request) => (
                <button
                  key={request.id}
                  onClick={() => onRequestClick(request)}
                  className="w-full text-left hover:bg-gray-50 p-4 rounded-lg border border-gray-200 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center mb-2">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {request.employee_profiles?.first_name} {request.employee_profiles?.last_name}
                        </span>
                      </div>
                      <div className="flex items-center mb-2">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {formatDisplayDate(request.start_date)} - {formatDisplayDate(request.end_date)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {request.leave_type.charAt(0).toUpperCase() + request.leave_type.slice(1)} Leave
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                  {request.reason && (
                    <p className="mt-2 text-sm text-gray-500">{request.reason}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(groupedRequests).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p>No leave requests found</p>
          </div>
        )}
      </div>
    </div>
  );
}