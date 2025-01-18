import React from 'react';
import { Clock, User, FileText } from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';

interface ActivityItem {
  id: string;
  type: 'user' | 'timesheet' | 'leave' | 'document';
  description: string;
  timestamp: string;
  user: {
    name: string;
    email: string;
  };
}

interface TenantActivityProps {
  activities: ActivityItem[];
}

export function TenantActivity({ activities }: TenantActivityProps) {
  function getActivityIcon(type: string) {
    switch (type) {
      case 'user':
        return User;
      case 'timesheet':
        return Clock;
      default:
        return FileText;
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
      <div className="flow-root">
        <ul className="-mb-8">
          {activities.map((activity, activityIdx) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== activities.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-gray-500" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">{activity.description}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          by {activity.user.name}
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        {formatDisplayDate(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      {activities.length === 0 && (
        <p className="text-sm text-gray-500 text-center">No recent activity</p>
      )}
    </div>
  );
}