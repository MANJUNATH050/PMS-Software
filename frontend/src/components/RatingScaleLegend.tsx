import React from 'react';

export const RatingScaleLegend: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-blue-50/70 border border-emerald-200/80 rounded-xl p-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
          ?
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Rating Scale Reference</h4>
          <p className="text-xs text-gray-500">Standard 1–5 performance rating criteria across all evaluation modules</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
        <div className="bg-white/90 border border-red-200 rounded-lg p-2.5 shadow-2xs transition-all hover:shadow-xs">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center">1</span>
            <span className="text-xs font-semibold text-red-700">Unsatisfactory</span>
          </div>
          <p className="text-[11px] text-gray-600 leading-tight">Lowest performance level. Fails to meet basic role requirements.</p>
        </div>

        <div className="bg-white/90 border border-orange-200 rounded-lg p-2.5 shadow-2xs transition-all hover:shadow-xs">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center">2</span>
            <span className="text-xs font-semibold text-orange-700">Needs Improvement</span>
          </div>
          <p className="text-[11px] text-gray-600 leading-tight">Below expectations. Inconsistent execution and output quality.</p>
        </div>

        <div className="bg-white/90 border border-amber-200 rounded-lg p-2.5 shadow-2xs transition-all hover:shadow-xs">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">3</span>
            <span className="text-xs font-semibold text-amber-700">Meets Expectations</span>
          </div>
          <p className="text-[11px] text-gray-600 leading-tight">Satisfactory performance. Consistently fulfills assigned targets.</p>
        </div>

        <div className="bg-white/90 border border-blue-200 rounded-lg p-2.5 shadow-2xs transition-all hover:shadow-xs">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">4</span>
            <span className="text-xs font-semibold text-blue-700">Exceeds Expectations</span>
          </div>
          <p className="text-[11px] text-gray-600 leading-tight">Very good performance. Exceeds standard targets with high quality.</p>
        </div>

        <div className="bg-white/90 border border-emerald-200 rounded-lg p-2.5 shadow-2xs transition-all hover:shadow-xs">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">5</span>
            <span className="text-xs font-semibold text-emerald-700">Exceptional</span>
          </div>
          <p className="text-[11px] text-gray-600 leading-tight">Outstanding performance. Demonstrates exemplary leadership & innovation.</p>
        </div>
      </div>
    </div>
  );
};
