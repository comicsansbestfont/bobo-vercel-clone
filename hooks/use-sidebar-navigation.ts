/**
 * Sidebar Navigation Hook
 *
 * Manages drill-down state for sidebar navigation between main view and detail view
 *
 * M312B-03: Navigation Hook
 */

'use client';

import { useState, useCallback } from 'react';

export interface SelectedEntity {
  type: 'deal' | 'client';
  id: string;
  name: string;
  folderPath: string; // e.g., 'advisory/deals/MyTab'
}

export interface SidebarNavigationState {
  selectedEntity: SelectedEntity | null;
  drillInto: (entity: SelectedEntity) => void;
  goBack: () => void;
  isDetailView: boolean;
}

export function useSidebarNavigation(): SidebarNavigationState {
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);

  const drillInto = useCallback((entity: SelectedEntity) => {
    setSelectedEntity(entity);
  }, []);

  const goBack = useCallback(() => {
    setSelectedEntity(null);
  }, []);

  return {
    selectedEntity,
    drillInto,
    goBack,
    isDetailView: selectedEntity !== null,
  };
}
