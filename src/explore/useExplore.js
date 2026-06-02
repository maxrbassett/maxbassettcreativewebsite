import { create } from 'zustand'

/* Shared state for the 3D explore experience.
 * - nearby: the interactable currently in range ({ id, title }) or null,
 *   set each frame by the in-world ProximityDetector.
 * - active: the project whose content panel is open, or null. While set,
 *   character control is disabled and the mobile joystick is hidden. */
export const useExplore = create((set) => ({
  nearby: null,
  active: null,
  setNearby: (nearby) => set({ nearby }),
  open: (project) => set({ active: project }),
  close: () => set({ active: null }),
}))
