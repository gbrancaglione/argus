type Tab = {
  key: string;
  label: string;
};

type TabBarProps = {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
};

export default function TabBar({ tabs, activeTab, onChange }: TabBarProps) {
  return (
    <div className="flex border-b border-neutral-lightest">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-6 py-3 text-sm font-bold cursor-pointer transition-colors ${
            activeTab === tab.key
              ? "text-brand-primary border-b-2 border-brand-primary"
              : "text-neutral-medium hover:text-neutral-dark"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
