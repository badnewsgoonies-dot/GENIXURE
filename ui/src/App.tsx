import AppShell from './components/layout/AppShell';
import { Tabs, TabList, Tab, TabPanel } from './components/primitives/Tabs';
import CompendiumPage from './pages/CompendiumPage';
import AnalysisPage from './pages/AnalysisPage';
import SimulationPage from './pages/SimulationPage';
import { SimProvider } from './state/SimContext';

export default function App() {
  return (
    <SimProvider>
    <AppShell>
      <header className="flex items-center justify-between border-b border-border p-3">
        <h1 className="text-lg font-bold tracking-wide">
          He Is Coming — <span className="text-primary">Loadout Builder</span>
        </h1>
      </header>

      <Tabs defaultValue="compendium" className="p-3">
        <TabList ariaLabel="Primary navigation">
          <Tab value="compendium">Compendium</Tab>
          <Tab value="analysis">Analysis</Tab>
          <Tab value="simulation">Simulation</Tab>
        </TabList>
        <TabPanel value="compendium"><CompendiumPage /></TabPanel>
        <TabPanel value="analysis"><AnalysisPage /></TabPanel>
        <TabPanel value="simulation"><SimulationPage /></TabPanel>
      </Tabs>
    </AppShell>
    </SimProvider>
  );
}
