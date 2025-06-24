
import React from 'react';
import { EvaluationResult, EvaluationItem, CorrectlySelectedItem } from '../types';

interface ResultsDisplayProps {
  result: EvaluationResult;
  onRestart: () => void;
}

const ResultSection: React.FC<{ title: string; items?: EvaluationItem[] | CorrectlySelectedItem[]; children?: React.ReactNode; bgColor?: string; textColor?: string }> = 
  ({ title, items, children, bgColor = 'bg-slate-800', textColor = 'text-sky-400' }) => {
  
  const renderItem = (item: EvaluationItem | CorrectlySelectedItem, index: number) => {
    if ('itemText' in item && 'reason' in item) { // EvaluationItem
      return (
        <li key={index} className="mb-3 p-3 bg-slate-700 rounded-md">
          {item.questionText && <p className="text-sm text-slate-400 mb-1">相關問題：{item.questionText}</p>}
          <p className="font-semibold text-slate-100">{item.itemText}</p>
          <p className="text-sm text-slate-300">{item.reason}</p>
        </li>
      );
    }
    if ('questionText' in item && 'selectedItems' in item) { // CorrectlySelectedItem
      return (
         <li key={index} className="mb-3 p-3 bg-slate-700 rounded-md">
          <p className="text-sm font-medium text-slate-300 mb-1">針對問題：「{item.questionText}」</p>
          <p className="font-semibold text-slate-100">您選擇了：{item.selectedItems.join('、 ')}</p>
        </li>
      )
    }
    return null;
  };

  if (!children && (!items || items.length === 0)) {
    return null; 
  }

  return (
    <div className={`p-6 rounded-xl shadow-lg ${bgColor} mb-6`}>
      <h3 className={`text-2xl font-semibold ${textColor} mb-4`}>{title}</h3>
      {items && items.length > 0 && (
        <ul className="space-y-2 list-disc list-inside pl-1">
          {items.map(renderItem)}
        </ul>
      )}
      {children && <div className="text-slate-200 prose prose-invert max-w-none">{children}</div>}
    </div>
  );
};


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, onRestart }) => {
  const scoreColor = result.score >= 80 ? 'text-green-400' : result.score >= 50 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-6">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl mb-8 text-center">
        <h2 className="text-4xl font-bold text-sky-400 mb-4">測驗結果分析</h2>
        <p className="text-6xl font-extrabold mb-2" style={{ color: scoreColor }}>{result.score} <span className="text-3xl text-slate-300">/ 100</span></p>
        <p className="text-lg text-slate-300">{result.overallFeedback}</p>
      </div>

      <ResultSection title="✅ 您正確選擇的項目" items={result.correctlySelectedSummary} bgColor="bg-green-800/30" textColor="text-green-400" />
      
      {result.missedEssential && result.missedEssential.length > 0 && (
        <ResultSection title="⚠️ 遺漏的必要物資" items={result.missedEssential} bgColor="bg-red-800/30" textColor="text-red-400" />
      )}
      
      {result.summaryOfMissedEssentials && (
         <ResultSection title="📝 必要物資遺漏總結" bgColor="bg-yellow-800/30" textColor="text-yellow-400">
            <p className="text-slate-200">{result.summaryOfMissedEssentials}</p>
         </ResultSection>
      )}

      {result.selectedOptional && result.selectedOptional.length > 0 && (
        <ResultSection title="💡 您選擇的可有可無物資" items={result.selectedOptional} bgColor="bg-blue-800/30" textColor="text-blue-400" />
      )}

      {result.selectedNonEssential && result.selectedNonEssential.length > 0 && (
        <ResultSection title="❌ 您選擇的非必要物資" items={result.selectedNonEssential} bgColor="bg-orange-800/30" textColor="text-orange-400" />
      )}

      <button
        onClick={onRestart}
        className="w-full mt-8 bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 px-6 rounded-lg text-xl shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75"
      >
        重新測驗
      </button>
    </div>
  );
};

export default ResultsDisplay;
    