
import React from 'react';

const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "載入中..." }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full my-8">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-500 mb-4"></div>
      <p className="text-sky-400 text-lg">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
    