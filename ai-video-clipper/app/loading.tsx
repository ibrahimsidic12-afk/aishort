export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Animated logo */}
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl gradient-bg animate-pulse-soft">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
          </svg>
        </div>
        {/* Loading dots */}
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
