import React from 'react';
import { Check } from 'lucide-react';

interface TimelineProps {
  status: string;
}

export const Timeline: React.FC<TimelineProps> = ({ status }) => {
  const steps = [
    { label: 'Self Assessment', desc: 'Employee Rating' },
    { label: 'Submitted', desc: 'Awaiting Verification' },
    { label: 'Manager Review', desc: 'Manager Evaluation' },
    { label: 'HR Review', desc: 'HR Verification' },
    { label: 'Final Result', desc: 'Cycle Completed' },
  ];

  const getActiveStep = () => {
    switch (status) {
      case 'PMS_NOT_STARTED':
        return -1;
      case 'PMS_STARTED':
      case 'SELF_ASSESSMENT_DRAFT':
        return 0; // Self assessment in progress
      case 'SELF_ASSESSMENT_SUBMITTED':
      case 'MANAGER_REVIEW_PENDING':
        return 2; // Manager review pending
      case 'MANAGER_REVIEW_SUBMITTED':
      case 'HR_REVIEW_PENDING':
        return 3; // HR review pending
      case 'HR_REVIEW_COMPLETED':
      case 'RATING_AND_POINTS_CALCULATED':
      case 'FINAL_ANALYSIS':
      case 'FINAL_RESULT_PUBLISHED':
      case 'COMPLETED':
        return 5; // Final result published (all completed)
      default:
        return 0;
    }
  };

  const currentStepIndex = getActiveStep();

  return (
    <div className="py-6 px-2">
      {/* Horizontal Stepper for Desktop */}
      <div className="hidden md:flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex || (currentStepIndex === 5 && index === 4);
          const isUpcoming = index > currentStepIndex && currentStepIndex !== 5;

          return (
            <React.Fragment key={step.label}>
              {/* Step circle */}
              <div className="flex flex-col items-center flex-1 relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${
                    isCompleted
                      ? 'bg-pms-green border-pms-green text-white shadow-md'
                      : isActive
                      ? 'border-pms-green bg-white text-pms-darkGreen ring-4 ring-pms-lightGreen font-bold'
                      : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check size={18} /> : <span>{index + 1}</span>}
                </div>
                <div className="mt-3 text-center">
                  <p className={`text-xs font-semibold ${isActive ? 'text-pms-darkGreen' : 'text-slate-600'}`}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{step.desc}</p>
                </div>
              </div>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 -mt-10 relative">
                  <div className="absolute inset-0 bg-slate-200 w-full h-full"></div>
                  <div
                    className="absolute inset-0 bg-pms-green h-full transition-all duration-500"
                    style={{ width: index < currentStepIndex ? '100%' : '0%' }}
                  ></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Vertical Stepper for Mobile */}
      <div className="flex flex-col md:hidden space-y-6">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex || (currentStepIndex === 5 && index === 4);

          return (
            <div key={step.label} className="flex items-start">
              {/* Stepper column */}
              <div className="flex flex-col items-center mr-4 relative">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${
                    isCompleted
                      ? 'bg-pms-green border-pms-green text-white'
                      : isActive
                      ? 'border-pms-green bg-white text-pms-darkGreen ring-4 ring-pms-lightGreen font-bold'
                      : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check size={14} /> : <span className="text-xs">{index + 1}</span>}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-0.5 absolute top-8 bottom-0 -mb-6 ${
                      index < currentStepIndex ? 'bg-pms-green' : 'bg-slate-200'
                    }`}
                  ></div>
                )}
              </div>
              <div className="pt-0.5">
                <p className={`text-sm font-semibold ${isActive ? 'text-pms-darkGreen' : 'text-slate-600'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-slate-400">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default Timeline;
