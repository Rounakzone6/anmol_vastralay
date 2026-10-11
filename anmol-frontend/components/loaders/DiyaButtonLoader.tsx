'use client';

export default function DiyaButtonLoader({
  text = 'Please wait...',
  textColor = 'text-white',
}: {
  text?: string;
  textColor?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${textColor}`}>
      {/* 3 Golden Pearl Beads */}
      <span className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
      </span>
      {text && <span className="font-medium tracking-wide">{text}</span>}
    </span>
  );
}
