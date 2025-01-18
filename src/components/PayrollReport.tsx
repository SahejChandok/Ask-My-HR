import React from 'react';
import { PayrollRun, Payslip } from '../types';
import { Download } from 'lucide-react';

interface PayrollReportProps {
  run: PayrollRun;
  payslips: Payslip[];
}

export function PayrollReport({ run, payslips }: PayrollReportProps) {
  const totals = payslips.reduce(
    (acc, slip) => ({
      grossPay: acc.grossPay + slip.gross_pay,
      kiwiSaverEmployee: acc.kiwiSaverEmployee + slip.kiwisaver_deduction,
      kiwiSaverEmployer: acc.kiwiSaverEmployer + slip.employer_kiwisaver,
      payeTax: acc.payeTax + slip.paye_tax,
      netPay: acc.netPay + slip.net_pay,
    }),
    {
      grossPay: 0,
      kiwiSaverEmployee: 0,
      kiwiSaverEmployer: 0,
      payeTax: 0,
      netPay: 0,
    }
  );

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Payroll Summary Report
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {new Date(run.period_start).toLocaleDateString()} -{' '}
            {new Date(run.period_end).toLocaleDateString()}
          </p>
        </div>
        <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <Download className="h-4 w-4 mr-2" />
          Export
        </button>
      </div>

      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Gross Pay
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              ${totals.grossPay.toFixed(2)}
            </dd>
          </div>

          <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total PAYE Tax
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              ${totals.payeTax.toFixed(2)}
            </dd>
          </div>

          <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Net Pay
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              ${totals.netPay.toFixed(2)}
            </dd>
          </div>
        </dl>

        <div className="mt-8">
          <h4 className="text-lg font-medium text-gray-900 mb-4">KiwiSaver Summary</h4>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Employee Contributions
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                ${totals.kiwiSaverEmployee.toFixed(2)}
              </dd>
            </div>

            <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Employer Contributions
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                ${totals.kiwiSaverEmployer.toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}