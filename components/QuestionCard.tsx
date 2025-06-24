
import React from 'react';
import { Question, Option as OptionType } from '../types';

interface QuestionCardProps {
  question: Question;
  selectedOptions: string[];
  onOptionChange: (optionId: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, selectedOptions, onOptionChange }) => {
  if (!question) {
    return <p className="text-center text-red-400">問題載入失敗。</p>;
  }

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-2xl">
      <h2 className="text-xl font-semibold text-sky-400 mb-1">主題：{question.theme}</h2>
      <p className="text-2xl font-bold mb-6 text-slate-100">{question.questionText}</p>
      <div className="space-y-3">
        {question.options.map((option: OptionType) => (
          <label
            key={option.id}
            className={`flex items-center p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:bg-slate-700/70
              ${selectedOptions.includes(option.id) ? 'bg-sky-600 border-sky-400 ring-2 ring-sky-300' : 'bg-slate-700 border-slate-600 hover:border-sky-500'}
            `}
          >
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-sky-500 bg-slate-600 border-slate-500 rounded focus:ring-sky-400 focus:ring-offset-0 focus:ring-offset-slate-800 mr-4"
              checked={selectedOptions.includes(option.id)}
              onChange={() => onOptionChange(option.id)}
            />
            <span className={`text-lg ${selectedOptions.includes(option.id) ? 'text-white font-medium' : 'text-slate-200'}`}>{option.text}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
    