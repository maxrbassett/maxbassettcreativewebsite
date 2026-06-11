import { create } from 'zustand'

/* Shared state for the 3D explore experience.
 * - nearby: the interactable currently in range ({ id, title }) or null,
 *   set each frame by the in-world ProximityDetector.
 * - active: the interactable whose content panel/dialogue is open, or null. The
 *   overlay reads active.type to pick the panel (project / video / about), and
 *   the NPC speech bubble reads it for the 'npc' type.
 * - dialogueStep: current line index for the NPC's stepped dialogue. */
export const useExplore = create((set, get) => ({
  nearby: null,
  active: null,
  dialogueStep: 0,
  // Full-screen fade overlay opacity (0–1), driven during launch-pad teleports.
  fade: 0,
  setFade: (fade) => set({ fade }),
  setNearby: (nearby) => set({ nearby }),
  open: (item) => set({ active: item, dialogueStep: 0 }),
  close: () => set({ active: null, dialogueStep: 0 }),
  // Advance the NPC dialogue one line; close it after the last line.
  advanceDialogue: () => {
    const { active, dialogueStep } = get()
    if (active?.type !== 'npc') return
    if (dialogueStep < active.npc.lines.length - 1) set({ dialogueStep: dialogueStep + 1 })
    else set({ active: null, dialogueStep: 0 })
  },
}))
