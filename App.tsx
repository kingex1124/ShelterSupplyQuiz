
import React, { useState, useEffect, useCallback } from 'react';
import { Question, UserAnswers, EvaluationResult } from './types';
import { generateQuestions, evaluateAnswers } from './services/geminiService';
import { TOTAL_QUESTIONS } from './constants';
import QuestionCard from './components/QuestionCard';
import ProgressBar from './components/ProgressBar';
import ResultsDisplay from './components/ResultsDisplay';
import LoadingSpinner from './components/LoadingSpinner';

enum AppState {
  LoadingQuestions,
  Answering,
  Submitting,
  ShowingResults,
  Error,
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LoadingQuestions);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [quizResult, setQuizResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    setAppState(AppState.LoadingQuestions);
    setError(null);
    try {
      const fetchedQuestions = await generateQuestions();
      if (fetchedQuestions.length > 0) {
        setQuestions(fetchedQuestions);
        setUserAnswers({});
        setCurrentQuestionIndex(0);
        setAppState(AppState.Answering);
      } else {
        throw new Error("未能成功載入任何問題。");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "載入問題時發生未知錯誤。");
      setAppState(AppState.Error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleOptionChange = (optionId: string) => {
    setUserAnswers(prevAnswers => {
      const currentQuestionId = questions[currentQuestionIndex].id;
      const existingSelections = prevAnswers[currentQuestionId] || [];
      const newSelections = existingSelections.includes(optionId)
        ? existingSelections.filter(id => id !== optionId)
        : [...existingSelections, optionId];
      return { ...prevAnswers, [currentQuestionId]: newSelections };
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setAppState(AppState.Submitting);
    setError(null);
    try {
      const result = await evaluateAnswers(questions, userAnswers);
      setQuizResult(result);
      setAppState(AppState.ShowingResults);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "提交答案評估時發生未知錯誤。");
      setAppState(AppState.Error);
    }
  };
  
  const handleRestartQuiz = () => {
    setQuestions([]);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setQuizResult(null);
    setError(null);
    loadQuestions(); // This will set state to LoadingQuestions
  };


  if (appState === AppState.LoadingQuestions) {
    return <div className="min-h-screen flex flex-col items-center justify-center p-4"><LoadingSpinner message="正在產生測驗題目..." /></div>;
  }

  if (appState === AppState.Error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">發生錯誤</h1>
        <p className="text-xl text-slate-300 mb-6">{error || "發生未知錯誤，請稍後再試。"}</p>
        <button
          onClick={handleRestartQuiz}
          className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md transition-colors"
        >
          重試
        </button>
      </div>
    );
  }
  
  if (appState === AppState.Submitting) {
     return <div className="min-h-screen flex flex-col items-center justify-center p-4"><LoadingSpinner message="正在評估您的答案..." /></div>;
  }

  if (appState === AppState.ShowingResults && quizResult) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-start p-4 pt-8 md:pt-12 bg-slate-900">
        <ResultsDisplay result={quizResult} onRestart={handleRestartQuiz} />
      </div>
    );
  }

  if (appState === AppState.Answering && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900">
        <div className="w-full max-w-2xl">
          <h1 className="text-4xl font-extrabold text-center text-sky-300 mb-2">戰爭避難物資測驗</h1>
          <p className="text-center text-slate-400 mb-8">評估您對緊急避難物資的了解程度。</p>
          <ProgressBar current={currentQuestionIndex + 1} total={TOTAL_QUESTIONS} />
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              selectedOptions={userAnswers[currentQuestion.id] || []}
              onOptionChange={handleOptionChange}
            />
          )}
          <div className="mt-8 flex justify-between items-center w-full">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一題
            </button>
            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors"
              >
                下一題
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors"
              >
                提交答案
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen flex items-center justify-center"><p className="text-xl">未知應用程式狀態。</p></div>; // Fallback
};

export default App;
    