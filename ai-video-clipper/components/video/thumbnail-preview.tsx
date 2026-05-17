interface ThumbnailPreviewProps {
  src: string | null;
  alt?: string;
  onSelect?: () => void;
  selected?: boolean;
}

export function ThumbnailPreview({
  src,
  alt = "Thumbnail",
  onSelect,
  selected = false,
}: ThumbnailPreviewProps) {
  return (
    <button
      onClick={onSelect}
      className={`overflow-hidden rounded-md border-2 transition ${
        selected ? "border-primary" : "border-transparent hover:border-muted-foreground/50"
      }`}
    >
      {src ? (
        <img src={src} alt={alt} className="aspect-video w-full object-cover" />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-muted text-xs text-muted-foreground">
          No thumbnail
        </div>
      )}
    </button>
  );
}
