import React from 'react';

export interface KpiChartItem {
  kpiName: string;
  weightage?: number;
  selfRating?: number | null;
  managerRating?: number | null;
  hrRating?: number | null;
}

export const KpiRatingChart: React.FC<{ items: KpiChartItem[]; title?: string }> = ({
  items,
  title = 'KPI Rating Breakdown',
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  const getBarWidth = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return '0%';
    const pct = Math.min(100, Math.max(0, (val / 5.0) * 100));
    return `${pct}%`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {title}
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span> Self
          </span>
          <span className="flex items-center gap-1 text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Manager
          </span>
          <span className="flex items-center gap-1 text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> HR (25%)
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-1.5 bg-gray-50/60 rounded-lg p-3 border border-gray-100">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
              <span className="truncate max-w-[70%]">{item.kpiName}</span>
              {item.weightage !== undefined && (
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[11px]">
                  Weightage: {item.weightage}%
                </span>
              )}
            </div>

            {/* Self Rating Bar */}
            {item.selfRating !== undefined && item.selfRating !== null && (
              <div className="flex items-center gap-2 text-xs">
                <span className="w-16 text-gray-500 text-[11px]">Self:</span>
                <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: getBarWidth(item.selfRating) }}
                  />
                </div>
                <span className="w-8 text-right font-medium text-gray-700">{item.selfRating}</span>
              </div>
            )}

            {/* Manager Rating Bar */}
            {item.managerRating !== undefined && item.managerRating !== null && (
              <div className="flex items-center gap-2 text-xs">
                <span className="w-16 text-gray-500 text-[11px]">Manager:</span>
                <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: getBarWidth(item.managerRating) }}
                  />
                </div>
                <span className="w-8 text-right font-medium text-gray-700">{item.managerRating}</span>
              </div>
            )}

            {/* HR Rating Bar */}
            {item.hrRating !== undefined && item.hrRating !== null && (
              <div className="flex items-center gap-2 text-xs">
                <span className="w-16 text-gray-500 text-[11px]">HR:</span>
                <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: getBarWidth(item.hrRating) }}
                  />
                </div>
                <span className="w-8 text-right font-medium text-gray-700">{item.hrRating}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
