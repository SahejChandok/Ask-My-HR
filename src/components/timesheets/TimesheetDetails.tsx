import React, { useState } from 'react';
import { Timesheet, TimesheetEntry } from '../../types';
import { Clock, Calendar, User, Edit2, Save, X, Trash2, Plus } from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';
import { supabase } from '../../lib/supabase';

interface TimesheetDetailsProps {
  timesheet: Timesheet & { entries?: TimesheetEntry[] };
  onClose: () => void;
  onUpdate: () => void;
}

export function TimesheetDetails({ timesheet, onClose, onUpdate }: TimesheetDetailsProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState(timesheet.entries || []);
  const [error, setError] = useState<string>();

  // Calculate total hours
  const totalHours = entries.reduce((total, entry) => {
    const start = new Date(`1970-01-01T${entry.start_time}`);
    const end = new Date(`1970-01-01T${entry.end_time}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const breakHours = (entry.break_minutes || 0) / 60;
    return total + (hours - breakHours);
  }, 0);

  const handleAddEntry = () => {
    setEntries([
      ...entries,
      {
        id: `temp-${Date.now()}`,
        timesheet_id: timesheet.id,
        date: timesheet.period_start,
        start_time: '09:00',
        end_time: '17:00',
        break_minutes: 30,
        description: '',
      },
    ]);
  };

  const handleUpdateEntry = (index: number, field: string, value: string | number) => {
    setEntries(
      entries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleDeleteEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(undefined);

    try {
      // Validate entries
      for (const entry of entries) {
        if (!entry.date || !entry.start_time || !entry.end_time) {
          throw new Error('All entries must have date, start time and end time');
        }
      }

      // Update existing entries
      const { error: updateError } = await supabase
        .from('timesheet_entries')
        .upsert(
          entries.map(entry => ({
            ...entry,
            timesheet_id: timesheet.id,
          }))
        );

      if (updateError) throw updateError;

      onUpdate();
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Timesheet Details
            </h3>
            <div className="text-sm text-gray-500">
              {timesheet.employee_profiles?.first_name} {timesheet.employee_profiles?.last_name}
            </div>
            <div className="flex items-center space-x-2">
              {!editing && timesheet.status === 'submitted' && (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </button>
              )}
              {editing && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-2" />
              Period: {formatDisplayDate(timesheet.period_start)} - {formatDisplayDate(timesheet.period_end)}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-2" />
              Total Hours: {totalHours.toFixed(2)}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <User className="w-4 h-4 mr-2" />
              <span className={`ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                ${timesheet.status === 'approved' ? 'bg-green-100 text-green-800' : 
                  timesheet.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'}`}>
                {timesheet.status}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Break (min)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  {editing && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map((entry, index) => {
                  const start = new Date(`1970-01-01T${entry.start_time}`);
                  const end = new Date(`1970-01-01T${entry.end_time}`);
                  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  const breakHours = (entry.break_minutes || 0) / 60;
                  const totalHours = hours - breakHours;

                  return (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editing ? (
                          <input
                            type="date"
                            value={entry.date}
                            onChange={(e) => handleUpdateEntry(index, 'date', e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        ) : (
                          formatDisplayDate(entry.date)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editing ? (
                          <input
                            type="time"
                            value={entry.start_time}
                            onChange={(e) => handleUpdateEntry(index, 'start_time', e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        ) : (
                          entry.start_time
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editing ? (
                          <input
                            type="time"
                            value={entry.end_time}
                            onChange={(e) => handleUpdateEntry(index, 'end_time', e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        ) : (
                          entry.end_time
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editing ? (
                          <input
                            type="number"
                            value={entry.break_minutes || 0}
                            onChange={(e) => handleUpdateEntry(index, 'break_minutes', parseInt(e.target.value))}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        ) : (
                          entry.break_minutes || 0
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {totalHours.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {editing ? (
                          <input
                            type="text"
                            value={entry.description || ''}
                            onChange={(e) => handleUpdateEntry(index, 'description', e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        ) : (
                          entry.description
                        )}
                      </td>
                      {editing && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteEntry(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {editing && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4">
                      <button
                        onClick={handleAddEntry}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Entry
                      </button>
                    </td>
                  </tr>
                )}
                <tr className="bg-gray-50">
                  <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Total Hours
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {totalHours.toFixed(2)}
                  </td>
                  <td colSpan={editing ? 2 : 1} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}