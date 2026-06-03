import { create } from 'zustand'

/* Shared state for the 3D explore experience.
 * - nearby: the interactable currently in range ({ id, title }) or null,
 *   set each frame by the in-world ProximityDetector.
 * - active: the interactable whose content panel is open, or null. The
 *   overlay reads active.type to pick the panel (project / video / about).
 *   While set, character control is disabled and the joystick is hidden. */
export const useExplore = create((set) => ({
  nearby: null,
  active: null,
  setNearby: (nearby) => set({ nearby }),
  open: (item) => set({ active: item }),
  close: () => set({ active: null }),
}))
