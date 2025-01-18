import React from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';

interface IRDScheduleValidationProps {
  validation: {
    valid: boolean;
    message?: string;
    details?: {
      nextDueDate: Date;
      daysUntilDue: number;
      pendingFilings: number;
    };
  };
}

export function IRDScheduleValidation({ validation }: IRDScheduleValidationProps) {
  if (!validation.details) return null;

  const { nextDueDate, daysUntilDue, pendingFilings } = validation.details;
  const isOverdue = daysUntilDue <= 0;
  const isDueSoon = daysUntilDue <= 5;

  return (
    <div className={`rounded-lg p-4 ${
      isOverdue ? 'bg-red-50' :
      isDueSoon ? 'bg-yellow-50' :
      'bg-green-50'
    }`}>
      <div className="flex">
        {isOverdue ? (
          <AlertTriangle className="h-5 w-5 text-red-400" />
        ) : isDueSoon ? (
          <Clock className="h-5 w-5 text-yellow-400" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-400" />
        )}
        
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${
            isOverdue ? 'text-red-800' :
            isDueSoon ? 'text-yellow-800' :
            'text-green-800'
          }`}>
            {isOverdue ? 'Filing Overdue' :
             isDueSoon ? 'Filing Due Soon' :
             'Next Filing'}
          </h3>

          <div className={`mt-2 text-sm ${
            isOverdue ? 'text-red-700' :
            isDueSoon ? 'text-yellow-700' :
            'text-green-700'
          }`}>
            <p>Due date: {formatDisplayDate(nextDueDate)}</p>
            {isOverdue ? (
              <p className="font-medium">Overdue by {Math.abs(daysUntilDue)} days</p>
            ) : (
              <p>Due in {daysUntilDue} days</p>
            )}
            
            {pendingFilings > 0 && (
              <p className="mt-2">
                {pendingFilings} filing{pendingFilings === 1 ? '' : 's'} pending submission
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}