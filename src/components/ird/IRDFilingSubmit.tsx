import React, { useState } from 'react';
import { AlertTriangle, FileText, Loader2, CheckCircle } from 'lucide-react';
import { PayrollRun } from '../../types';
import { formatDisplayDate } from '../../utils/dateUtils';
import { validateIRDFiling } from '../../utils/irdValidation';
import { submitIRDFiling } from '../../services/irdIntegration';
import { IRDFilingValidation } from './IRDFilingValidation';
import { IRDFilingMonitor } from './IRDFilingMonitor';

interface IRDFilingSubmitProps {
  run: PayrollRun;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function IRDFilingSubmit({ run, onSuccess, onError }: IRDFilingSubmitProps) {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<any>();
  const [filingId, setFilingId] = useState<string>();
  const [success, setSuccess] = useState(false);

  async function handleValidate() {
    try {
      setValidating(true);
      const result = await validateIRDFiling(run.id);
      setValidation(result);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Validation failed');
    } finally {
      setValidating(false);
    }
  }

  async function handleSubmit() {
    try {
      setLoading(true);

      // Validate first if not already validated
      if (!validation) {
        const result = await validateIRDFiling(run.id);
        if (!result.valid) {
          onError('Please fix validation errors before submitting');
          setValidation(result);
          return;
        }
      }

      const { success, error, filingId } = await submitIRDFiling(run.id, 'ir348');

      if (!success) {
        throw new Error(error);
      }

      setFilingId(filingId);
      setSuccess(true);
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to submit filing');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Submit IRD Filing
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Pay Period: {formatDisplayDate(run.period_start)} - {formatDisplayDate(run.period_end)}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleValidate}
            disabled={validating || loading || success}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {validating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Validate
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !validation?.valid || success}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : success ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            {success ? 'Filed Successfully' : 'Submit to IRD'}
          </button>
        </div>
      </div>

      {validation && (
        <div className="mt-4">
          <IRDFilingValidation validation={validation} />
        </div>
      )}

      {filingId && (
        <div className="mt-4">
          <IRDFilingMonitor 
            filingId={filingId}
            onStatusChange={(status) => {
              if (status === 'accepted') {
                onSuccess();
              } else if (status === 'rejected') {
                onError('Filing was rejected by IRD');
              }
            }}
          />
        </div>
      )}
    </div>
  );
}