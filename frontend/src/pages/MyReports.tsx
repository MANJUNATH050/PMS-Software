import React, { useEffect, useState } from 'react';
import { pmsApi } from '../api/pmsApi';
import { reportApi } from '../api/reportApi';
import { PmsHistory } from '../types';
import { FileText, Download, FileSpreadsheet, Eye, Calendar, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MyReports: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<PmsHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track downloading states per report & format
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    pmsApi.getHistory()
      .then((res) => {
        setReports(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to retrieve finalized reports.');
        setLoading(false);
      });
  }, []);

  const triggerDownload = async (assignmentId: number, format: 'pdf' | 'excel', cycleMonth: string) => {
    const key = `${assignmentId}-${format}`;
    setDownloading(prev => ({ ...prev, [key]: true }));

    const ext = format === 'pdf' ? 'pdf' : 'xlsx';
    const filename = `PMS_Report_${cycleMonth.replace(' ', '_')}.${ext}`;

    try {
      await reportApi.downloadReport(assignmentId, format, filename);
    } catch (err) {
      console.error(err);
      alert('Failed to download file. Please try again.');
    } finally {
      setDownloading(prev => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 skeleton-shimmer"></div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 h-64 skeleton-shimmer"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto mt-12 shadow-md">
        <AlertCircle className="text-rose-500 mx-auto mb-4" size={48} />
        <h3 className="text-lg font-bold text-pms-gray mb-2">Error Loading Reports</h3>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-pms-green hover:bg-pms-darkGreen text-white font-semibold rounded-lg text-sm transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-pms-gray">Appraisal Reports Repository</h2>
        <p className="text-xs text-slate-500 mt-1">
          Download PDF performance certifications or Excel data sheets of finalized appraisal cycles.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <FileText size={24} />
          </div>
          <h3 className="text-sm font-bold text-pms-gray mb-1">No reports available</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Finalized monthly PMS reports will appear here for download.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-white border border-slate-250/60 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex items-start justify-between gap-4">
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded bg-pms-lightGreen flex items-center justify-center text-pms-darkGreen font-semibold">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-pms-gray">{report.cycleMonth} appraisal</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Finalized on {report.finalizedDate}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded">
                    Score: {report.finalScore.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-bold text-pms-darkGreen bg-pms-lightGreen/50 px-2.5 py-0.5 rounded-full uppercase">
                    {report.grade}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 shrink-0 self-center">
                
                {/* View Details */}
                <button
                  onClick={() => navigate(`/history/${report.id}`)}
                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-pms-gray rounded-lg transition-colors flex items-center justify-center"
                  title="View online report detail"
                >
                  <Eye size={16} />
                </button>

                {/* Download PDF */}
                <button
                  onClick={() => triggerDownload(report.id, 'pdf', report.cycleMonth)}
                  disabled={downloading[`${report.id}-pdf`]}
                  className="p-2 border border-slate-200 hover:bg-slate-50 text-rose-600 rounded-lg transition-colors flex items-center justify-center"
                  title="Download PDF report"
                >
                  <Download size={16} className={downloading[`${report.id}-pdf`] ? 'animate-bounce' : ''} />
                </button>

                {/* Download Excel */}
                <button
                  onClick={() => triggerDownload(report.id, 'excel', report.cycleMonth)}
                  disabled={downloading[`${report.id}-excel`]}
                  className="p-2 border border-slate-200 hover:bg-slate-50 text-emerald-600 rounded-lg transition-colors flex items-center justify-center"
                  title="Download Excel spreadsheet"
                >
                  <FileSpreadsheet size={16} className={downloading[`${report.id}-excel`] ? 'animate-bounce' : ''} />
                </button>

              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default MyReports;
