interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ title, description, icon = "📭", action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <span className="text-4xl">{icon}</span>
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
