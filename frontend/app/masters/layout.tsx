import type { Metadata } from 'next';
import { ModuleGate } from '../../components/module-gate';
export const metadata: Metadata = {
  title: 'Магистратура за рубежом — Jarlyq',
  description: 'Магистерские программы в IT в университетах мира. Стипендии, сроки, стоимость.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ModuleGate module="masters">{children}</ModuleGate>;
}
