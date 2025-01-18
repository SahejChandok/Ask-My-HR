import React, { useState } from 'react';
import { PayrollRun, PayrollResultData } from '../../types';
import { Trash2, Loader2, RotateCcw, FileText, ChevronDown, ChevronUp, Download, AlertCircle, FileDown, Info } from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import { PayrollRollback } from './PayrollRollback';
import { PayslipView } from './payslip/PayslipView';
import { usePayrollHistory } from './hooks/usePayrollHistory';
import { exportSinglePayslip, exportPayrollRun } from '../../utils/payrollExport';

interface PayrollHistoryProps {
  payrollRuns: PayrollRun[];
  onSelect: (runId: string) => void;
  onDelete: (runId: string) => void;
  selectedRunId?: string;
  isDeleting: boolean;
  payslips?: PayrollResultData[];
}

export function PayrollHistory({
  payrollRuns,
  onSelect,
  onDelete,
  selectedRunId,
  isDeleting,
  payslips
}: PayrollHistoryProps) {
  const [rollbackRunId, setRollbackRunId] = useState<string>();
  const [expandedRunId, setExpandedRunId] = useState<string>();
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string>();
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv'>('pdf');
  const { summary, loading: summaryLoading } = usePayrollHistory(selectedRunId);

  // Safely format date with validation
  const formatDate = (date: string | null | undefined): string => {
    if (!date) return 'Invalid date';
    try {
      return formatDisplayDate(date);
    } catch (error) {
      console.warn('Invalid date:', date);
      return 'Invalid date';
    }
  };

  // Calculate totals for a payroll run
  const calculateTotals = (runPayslips: PayrollResultData[]) => {
    return runPayslips.reduce(
      (acc, { calculations }) => ({
        gross: acc.gross + calculations.grossPay,
        kiwisaver: acc.kiwisaver + calculations.kiwiSaverDeduction,
        employerKiwisaver: acc.employerKiwisaver + calculations.employerKiwiSaver,
        paye: acc.paye + calculations.payeTax,
        net: acc.net + calculations.netPay,
      }),
      { gross: 0, kiwisaver: 0, employerKiwisaver: 0, paye: 0, net: 0 }
    );
  };

  // Handle export of a single payslip
  async function handleExportPayslip(payslip: PayrollResultData, run: PayrollRun, format: 'pdf' | 'csv') {
    try {
      setExportError(undefined);
      await exportSinglePayslip(payslip, run, format);
    } catch (error) {
      console.error('Error exporting payslip:', error);
      setExportError('Failed to export payslip. Please try again.');
    }
  }

  // Handle bulk export of all payslips for a run
  async function handleBulkExport(runId: string, format: 'pdf' | 'csv') {
    if (!payslips) return;
    setExportError(undefined);
    setExportLoading(true);
    setSelectedFormat(format);

    try {
      const run = payrollRuns.find(r => r.id === runId);
      if (!run) return;

      const runPayslips = payslips.filter(p => p.payrollRunId === runId);
      if (runPayslips.length === 0) {
        setExportError('No payslips found for this payroll run');
        return;
      }
      
      await exportPayrollRun(runId, runPayslips, run, format);
    } catch (error) {
      console.error('Error exporting payslips:', error);
      setExportError(error instanceof Error ? error.message : 'Failed to export payslips');
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Payroll History
          {exportLoading && (
            <span className="ml-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 inline animate-spin mr-1" />
              Exporting...
            </span>
          )}
        </h3>
        {exportError && (
          <div className="mt-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            {exportError}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {payrollRuns.map((run) => {
            const isExpanded = expandedRunId === run.id;
            const runPayslips = payslips?.filter(p => p.payrollRunId === run.id);
            const totals = runPayslips ? calculateTotals(runPayslips) : null;

            return (
              <li key={run.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      onSelect(run.id);
                      setExpandedRunId(isExpanded ? undefined : run.id);
                    }}
                    className="flex-1 text-left hover:bg-gray-50 p-2 rounded-md transition-colors"
                  >
                    <div className="flex items-center">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 mr-2 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 mr-2 text-gray-400" />
                      )}
                      <div>
                        {summary && (
                          <div className="flex items-center mb-1">
                            <Info className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-xs text-gray-500">
                              Processed by {summary.processedBy} on {formatDisplayDate(summary.processedAt)}
                            </span>
                          </div>
                        )}
                        <p className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                          {formatDisplayDate(run.period_start)} - {formatDisplayDate(run.period_end)}
                          {run.status === 'voided' && (
                            <span className="ml-2 text-red-600">(Voided)</span>
                          )}
                        </p>
                        <div className="mt-1 text-sm text-gray-500 flex items-center">
                          Processed on {formatDisplayDate(run.created_at)}
                          {runPayslips && (
                            <span className="ml-2">
                              ({runPayslips.length} employees)
                            </span>
                          )}
                          {run.status === 'voided' && summary?.rollback && (
                            <span className="ml-2 text-red-500">
                              Voided by {summary.rollback.rolledBackBy} on {
                                formatDisplayDate(summary.rollback.timestamp)
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        run.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : run.status === 'voided'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {run.status}
                    </span>
                    {run.status === 'completed' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBulkExport(run.id, selectedFormat);
                          }} 
                          disabled={exportLoading || run.status === 'voided'}
                          className="inline-flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          {exportLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          Export {selectedFormat.toUpperCase()}
                        </button>
                        <select
                          value={selectedFormat}
                          onChange={(e) => setSelectedFormat(e.target.value as 'pdf' | 'csv')}
                          className="text-sm border border-gray-300 rounded-md"
                        >
                          <option value="pdf">PDF</option>
                          <option value="csv">CSV</option>
                        </select>
                        <button
                          onClick={() => setRollbackRunId(run.id)}
                          disabled={run.status === 'voided'}
                          className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                          title="Rollback payroll run"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && totals && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <dt className="text-sm font-medium text-gray-500">
                          Total Gross Pay
                        </dt>
                        <dd className="mt-1 text-2xl font-semibold text-gray-900">
                          {formatCurrency(totals.gross)}
                        </dd>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <dt className="text-sm font-medium text-gray-500">Total PAYE Tax</dt>
                        <dd className="mt-1 text-2xl font-semibold text-gray-900">
                          {formatCurrency(totals.paye)}
                        </dd>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <dt className="text-sm font-medium text-gray-500">Total Net Pay</dt>
                        <dd className="mt-1 text-2xl font-semibold text-gray-900">
                          {formatCurrency(totals.net)}
                        </dd>
                      </div>
                    </div>

                    {runPayslips && runPayslips.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Payslips</h4>
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Employee
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Gross Pay
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  PAYE
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  ACC Levy
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  KiwiSaver
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Net Pay
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {runPayslips.map((payslip) => (
                                <tr key={payslip.employee.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {payslip.employee.first_name} {payslip.employee.last_name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                    {formatCurrency(payslip.calculations.grossPay)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                    {formatCurrency(payslip.calculations.payeTax)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                    {formatCurrency(payslip.calculations.accLevy || 0)}
                                    {payslip.calculations.accLevyDetails && (
                                      <div className="text-xs text-gray-400">
                                        YTD: {formatCurrency(payslip.calculations.accLevyDetails.ytdEarnings)}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                    {formatCurrency(payslip.calculations.kiwiSaverDeduction)}
                                    {payslip.calculations.leaveDetails && (
                                      <div className="text-xs text-gray-400">
                                        Leave: {payslip.calculations.leaveDetails.hours}h
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                    <div className="flex items-center justify-end">
                                      {formatCurrency(payslip.calculations.netPay)}
                                      {!payslip.calculations.minimumWageCheck?.compliant && (
                                        <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                          Below Min Wage
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleExportPayslip(payslip, run, selectedFormat);
                                      }}
                                      disabled={run.status === 'voided'}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      {selectedFormat === 'pdf' ? (
                                        <FileText className="w-4 h-4" />
                                      ) : (
                                        <FileDown className="w-4 h-4" />
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              {runPayslips.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    No payslips found
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
          {payrollRuns.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500">
              No payroll runs found
              <p className="mt-2 text-sm">
                Process a new payroll run to see the history here
              </p>
            </li>
          )}
        </ul>
      </div>

      {rollbackRunId && (
        <PayrollRollback
          run={payrollRuns.find(r => r.id === rollbackRunId)!}
          onRollback={() => {
            setRollbackRunId(undefined);
            onSelect(rollbackRunId);
          }}
          onClose={() => setRollbackRunId(undefined)}
        />
      )}
    </div>
  );
}