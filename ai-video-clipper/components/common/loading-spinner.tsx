interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function LoadingSpinner({ size = "md", label }: LoadingSpinnerProps) {
  const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`animate-spin rounded-full border-4 border-primary border-t-transparent ${sizes[size]}`}
      />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}
