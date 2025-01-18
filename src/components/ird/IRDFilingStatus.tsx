import React from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';
import { IRDFilingFrequency } from '../../types/ird';

interface IRDFilingStatusProps {
  nextDueDate: Date | null;
  lastFilingDate: string | null;
  filingFrequency: IRDFilingFrequency;
  pendingFilings: number;
}

export function IRDFilingStatus({ 
  nextDueDate, 
  lastFilingDate, 
  filingFrequency,
  pendingFilings 
}: IRDFilingStatusProps) {
  if (!nextDueDate) return null;

  const today = new Date();
  const isDue = today >= nextDueDate;
  const isDueSoon = !isDue && 
    (nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 5;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Filing Status</h3>

      <div className="space-y-6">
        {/* Filing Schedule */}
        <div>
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-900">
              Filing Schedule: {filingFrequency.replace('-', ' ')}
            </span>
          </div>
          {lastFilingDate && (
            <p className="mt-1 text-sm text-gray-500">
              Last filed: {formatDisplayDate(lastFilingDate)}
            </p>
          )}
        </div>

        {/* Next Due Date */}
        <div className={`rounded-md p-4 ${
          isDue ? 'bg-red-50' : 
          isDueSoon ? 'bg-yellow-50' : 
          'bg-blue-50'
        }`}>
          <div className="flex">
            {isDue ? (
              <AlertTriangle className="h-5 w-5 text-red-400" />
            ) : isDueSoon ? (
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            ) : (
              <Clock className="h-5 w-5 text-blue-400" />
            )}
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${
                isDue ? 'text-red-800' : 
                isDueSoon ? 'text-yellow-800' : 
                'text-blue-800'
              }`}>
                {isDue ? 'Filing Overdue' : 
                 isDueSoon ? 'Filing Due Soon' : 
                 'Next Filing Due'}
              </h3>
              <div className={`mt-2 text-sm ${
                isDue ? 'text-red-700' : 
                isDueSoon ? 'text-yellow-700' : 
                'text-blue-700'
              }`}>
                <p>{formatDisplayDate(nextDueDate)}</p>
                {isDue ? (
                  <p className="font-medium">
                    Overdue by {Math.floor((today.getTime() - nextDueDate.getTime()) / (1000 * 60 * 60 * 24))} days
                  </p>
                ) : (
                  <p>Due in {Math.ceil((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pending Filings */}
        {pendingFilings > 0 && (
          <div className="bg-yellow-50 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Pending Filings
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{pendingFilings} payroll run{pendingFilings === 1 ? '' : 's'} pending filing</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Up to Date */}
        {!isDue && !isDueSoon && pendingFilings === 0 && (
          <div className="bg-green-50 rounded-md p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Up to Date
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>All payroll runs have been filed with IRD</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}