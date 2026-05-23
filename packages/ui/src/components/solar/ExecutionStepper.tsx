import React from 'react';
import clsx from 'clsx';
import { EXECUTION_STEPS } from '../../tokens/index';

export interface ExecutionStepperProps {
  currentStep: number;
  totalSteps?: number;
  steps?: typeof EXECUTION_STEPS;
  status?: 'running' | 'completed' | 'failed';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

type StepState = 'completed' | 'active' | 'pending' | 'failed';

function getStepState(stepId: number, currentStep: number, status?: string): StepState {
  if (status === 'failed' && stepId === currentStep) return 'failed';
  if (stepId < currentStep) return 'completed';
  if (stepId === currentStep) return 'active';
  return 'pending';
}

function StepNode({
  state,
  id,
}: {
  state: StepState;
  id: number;
}) {
  const colorMap: Record<StepState, string> = {
    completed: '#22C55E',
    active:    '#6366F1',
    pending:   'var(--color-solar-text-disabled)',
    failed:    '#EF4444',
  };
  const color = colorMap[state];

  return (
    <div
      className="relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        background: state === 'pending' ? 'var(--color-solar-elevated)' : `${color}22`,
        border: `2px solid ${color}`,
        boxShadow: state === 'active' ? `0 0 14px ${color}` : undefined,
      }}
    >
      {state === 'active' && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${color}`,
            animation: 'solar-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
          }}
        />
      )}
      {state === 'completed' && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7l3 3 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {state === 'failed' && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2l8 8M10 2L2 10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
      {(state === 'active' || state === 'pending') && (
        <span className="text-xs font-mono font-bold" style={{ color }}>{id}</span>
      )}
    </div>
  );
}

function StepTooltip({ step }: { step: { name: string; description: string } }) {
  return (
    <div
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap z-10 pointer-events-none"
      style={{
        background: 'var(--color-solar-elevated)',
        border: '1px solid var(--color-solar-border)',
        color: 'var(--color-solar-text-secondary)',
        boxShadow: 'var(--shadow-elevated)',
      }}
    >
      <div className="font-mono font-bold" style={{ color: 'var(--color-solar-text-primary)' }}>{step.name}</div>
      <div>{step.description}</div>
      {/* Arrow */}
      <span
        className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
        style={{ borderTopColor: 'var(--color-solar-border)' }}
      />
    </div>
  );
}

export function ExecutionStepper({
  currentStep,
  steps = EXECUTION_STEPS,
  status = 'running',
  className,
}: ExecutionStepperProps) {
  const [hoveredStep, setHoveredStep] = React.useState<number | null>(null);

  return (
    <div className={clsx('flex items-center gap-0 overflow-x-auto', className)}>
      {steps.map((step, idx) => {
        const state = getStepState(step.id, currentStep, status);
        const isLast = idx === steps.length - 1;
        const connectorColor =
          state === 'completed' ? '#22C55E' :
          idx < currentStep - 1 ? '#22C55E' :
          'var(--color-solar-border)';

        return (
          <React.Fragment key={step.id}>
            {/* Step node */}
            <div
              className="relative flex flex-col items-center gap-1.5 cursor-default"
              onMouseEnter={() => setHoveredStep(step.id)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              {hoveredStep === step.id && <StepTooltip step={step} />}
              <StepNode state={state} id={step.id} />
              <span
                className="text-xs font-mono font-medium hidden sm:block whitespace-nowrap"
                style={{
                  color:
                    state === 'active' ? '#6366F1' :
                    state === 'completed' ? '#22C55E' :
                    state === 'failed' ? '#EF4444' :
                    'var(--color-solar-text-disabled)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.05em',
                }}
              >
                {step.name}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className="flex-1 min-w-[1.5rem] h-0.5 -mt-5 transition-all duration-300"
                style={{ background: connectorColor }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
