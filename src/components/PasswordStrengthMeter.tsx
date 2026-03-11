import React from 'react';

type Props = {
  value: number; // 0-100
  level: 'Weak' | 'Fair' | 'Good' | 'Strong';
  hints?: string[];
};

const colors = {
  Weak: 'bg-red-500',
  Fair: 'bg-orange-400',
  Good: 'bg-yellow-400',
  Strong: 'bg-green-500'
} as const;

export const PasswordStrengthMeter: React.FC<Props> = ({ value, level, hints = [] }) => {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm">Fuerza: {level}</span>  
        <span className="text-xs text-gray-600">{value}%</span>
      </div>
      <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} className="w-full h-2 bg-gray-200 rounded overflow-hidden">
        <div className={`h-2 ${colors[level]}`} style={{ width: `${value}%`, transition: 'width .2s' }} />
      </div>
      {hints.length > 0 && (
        <details className="mt-2 text-xs text-gray-700">
          <summary className="cursor-pointer">Requisitos que faltan</summary>
          <ul className="mt-1 list-disc list-inside">
            {hints.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;
