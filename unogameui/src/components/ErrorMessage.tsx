import React from 'react';

interface ErrorMessageProps {
  message: string | null;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  );
}