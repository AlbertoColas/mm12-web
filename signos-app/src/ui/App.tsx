import { useState } from 'react';
import { TabBar, type TabId } from './components/TabBar';

const TITLES: Record<TabId, string> = {
  dictionary: 'Diccionario',
  recognize: 'Reconocer',
  accuracy: 'Precisión',
  settings: 'Ajustes',
};

export function App() {
  const [tab, setTab] = useState<TabId>('dictionary');

  return (
    <div className="app">
      <main className="screen" aria-labelledby="screen-title">
        <h1 id="screen-title">{TITLES[tab]}</h1>
        <p className="muted">Pantalla en construcción.</p>
      </main>
      <TabBar current={tab} onChange={setTab} />
    </div>
  );
}
