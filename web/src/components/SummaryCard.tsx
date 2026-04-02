type SummaryCardProps = {
  label: string;
  value: string;
  sublabel?: string;
};

export default function SummaryCard({ label, value, sublabel }: SummaryCardProps) {
  return (
    <div className="bg-neutral-white rounded-lg shadow-level-2 p-5 flex flex-col gap-1">
      <span className="text-sm text-neutral-medium">{label}</span>
      <span className="font-heading text-2xl font-black text-brand-primary">{value}</span>
      {sublabel && <span className="text-xs text-neutral-medium">{sublabel}</span>}
    </div>
  );
}
