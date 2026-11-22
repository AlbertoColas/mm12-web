import { Icon, type IconName } from './Icon';

export type TabId = 'dictionary' | 'recognize' | 'accuracy' | 'settings';

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'dictionary', label: 'Diccionario', icon: 'book' },
  { id: 'recognize', label: 'Reconocer', icon: 'eye' },
  { id: 'accuracy', label: 'Precisión', icon: 'target' },
  { id: 'settings', label: 'Ajustes', icon: 'gear' },
];

export function TabBar({ current, onChange }: { current: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="tabbar" aria-label="Secciones">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className="tab"
          aria-current={current === t.id ? 'page' : undefined}
          onClick={() => onChange(t.id)}
        >
          <Icon name={t.icon} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
