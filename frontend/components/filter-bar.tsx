'use client';

import * as Select from '@radix-ui/react-select';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { Stack, regions } from '../lib/api';

export interface FilterState {
  stackId?: string;
  regionId?: string;
  level?: string;
}

interface FilterBarProps {
  stacks: Stack[];
  value: FilterState;
  onChange: (value: FilterState) => void;
}

export function FilterBar({ stacks, value, onChange }: FilterBarProps) {
  const levels = [
    { id: 'intern', label: 'Intern' },
    { id: 'junior', label: 'Junior' },
    { id: 'middle', label: 'Middle' }
  ];

  return (
    <div className="card flex flex-col gap-4 p-4 md:flex-row md:items-center">
      <Select.Root
        value={value.stackId}
        onValueChange={(stackId) => onChange({ ...value, stackId: stackId || undefined })}
      >
        <Select.Trigger className="inline-flex min-w-[200px] items-center justify-between rounded-xl border border-slate-200/70 bg-white px-4 py-2 text-sm font-medium shadow-sm focus:outline-none dark:border-slate-700/60 dark:bg-slate-900/70">
          <Select.Value placeholder="Технология" />
          <Select.Icon>
            <ChevronDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <Select.Viewport className="p-2">
              <Select.Item value="" className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
                <Select.ItemText>Любой стек</Select.ItemText>
              </Select.Item>
              {stacks.map((stack) => (
                <Select.Item
                  key={stack.id}
                  value={String(stack.id)}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <Select.ItemText>{stack.name}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      <Select.Root
        value={value.regionId}
        onValueChange={(regionId) => onChange({ ...value, regionId: regionId || undefined })}
      >
        <Select.Trigger className="inline-flex min-w-[200px] items-center justify-between rounded-xl border border-slate-200/70 bg-white px-4 py-2 text-sm font-medium shadow-sm focus:outline-none dark:border-slate-700/60 dark:bg-slate-900/70">
          <Select.Value placeholder="Регион" />
          <Select.Icon>
            <ChevronDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <Select.Viewport className="p-2">
              <Select.Item value="" className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
                <Select.ItemText>Любой регион</Select.ItemText>
              </Select.Item>
              {regions.map((region) => (
                <Select.Item
                  key={region.id}
                  value={String(region.id)}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <Select.ItemText>{region.name}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      <Select.Root value={value.level} onValueChange={(level) => onChange({ ...value, level: level || undefined })}>
        <Select.Trigger className="inline-flex min-w-[200px] items-center justify-between rounded-xl border border-slate-200/70 bg-white px-4 py-2 text-sm font-medium shadow-sm focus:outline-none dark:border-slate-700/60 dark:bg-slate-900/70">
          <Select.Value placeholder="Уровень" />
          <Select.Icon>
            <ChevronDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <Select.Viewport className="p-2">
              <Select.Item value="" className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
                <Select.ItemText>Любой уровень</Select.ItemText>
              </Select.Item>
              {levels.map((level) => (
                <Select.Item
                  key={level.id}
                  value={level.id}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <Select.ItemText>{level.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
