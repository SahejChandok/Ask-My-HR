import React from 'react';
import { LeaveRequest } from '../../types';
import { formatDisplayDate } from '../../utils/dateUtils';
import { Calendar, Clock, User, FileText, CheckCircle, XCircle } from 'lucide-react';

interface LeaveRequestDetailsProps {
  request: LeaveRequest;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  canApprove?: boolean;
}

export function LeaveRequestDetails({
  request,
  onClose,
  onApprove,
  onReject,
  canApprove = false
}: LeaveRequestDetailsProps) {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Leave Request Details
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <User className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {request.employee_profiles?.first_name} {request.employee_profiles?.last_name}
                </p>
                <p className="text-sm text-gray-500">Employee</p>
              </div>
            </div>

            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {formatDisplayDate(request.start_date)} - {formatDisplayDate(request.end_date)}
                </p>
                <p className="text-sm text-gray-500">Leave Period</p>
              </div>
            </div>

            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {request.leave_type.charAt(0).toUpperCase() + request.leave_type.slice(1)} Leave
                </p>
                <p className="text-sm text-gray-500">Leave Type</p>
              </div>
            </div>

            {request.reason && (
              <div className="flex items-start">
                <FileText className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Reason</p>
                  <p className="mt-1 text-sm text-gray-500">{request.reason}</p>
                </div>
              </div>
            )}

            <div className="flex items-center">
              <div className={`px-4 py-2 rounded-full ${
                request.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : request.status === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </div>
            </div>

            {canApprove && request.status === 'pending' && (
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => onApprove?.(request.id)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </button>
                <button
                  onClick={() => onReject?.(request.id)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}