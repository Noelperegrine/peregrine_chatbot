export function TypingIndicator() {
  return (
    <div className="flex gap-1.5 items-center p-4">
      <div 
        className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" 
        style={{ animationDelay: '0ms', animationDuration: '1s' }}
      ></div>
      <div 
        className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" 
        style={{ animationDelay: '200ms', animationDuration: '1s' }}
      ></div>
      <div 
        className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" 
        style={{ animationDelay: '400ms', animationDuration: '1s' }}
      ></div>
    </div>
  );
}
