import { useState } from 'react';
import { TabBar, type TabId } from './components/TabBar';
import { CameraView } from './components/CameraView';

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
        {tab === 'recognize' ? (
          <>
            <p className="muted">Prueba de cámara: pon las manos delante y verás los puntos.</p>
            <CameraView />
          </>
        ) : (
          <p className="muted">Pantalla en construcción.</p>
        )}
      </main>
      <TabBar current={tab} onChange={setTab} />
    </div>
  );
}
