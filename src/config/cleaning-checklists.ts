// ==============================================================================
// Cleaning Checklist Engine (Figure 4: Checklist & ChecklistItem UML)
// Campus Cleanliness Management System — BAUST Saidpur
// ==============================================================================

export interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  isMandatory: boolean;
}

export const FACILITY_CHECKLISTS: Record<string, ChecklistItem[]> = {
  WASHROOM: [
    { id: 'w1', label: 'Sanitize washbasins, faucets, and vanity mirrors', category: 'WASHROOM', isMandatory: true },
    { id: 'w2', label: 'Disinfect and scrub urinals, toilet bowls & seats', category: 'WASHROOM', isMandatory: true },
    { id: 'w3', label: 'Restock hand soap dispenser and paper towels', category: 'WASHROOM', isMandatory: true },
    { id: 'w4', label: 'Empty sanitary bins and replace heavy-duty liners', category: 'WASHROOM', isMandatory: true },
    { id: 'w5', label: 'Mop floor tiles with hospital-grade disinfectant', category: 'WASHROOM', isMandatory: true },
  ],
  CLASSROOM: [
    { id: 'c1', label: 'Wipe whiteboard / blackboard and podium clean', category: 'CLASSROOM', isMandatory: true },
    { id: 'c2', label: 'Sanitize student armchairs, desks, and lectern', category: 'CLASSROOM', isMandatory: true },
    { id: 'c3', label: 'Sweep and wet-mop lecture hall floor tiles', category: 'CLASSROOM', isMandatory: true },
    { id: 'c4', label: 'Empty classroom wastebaskets & replace liners', category: 'CLASSROOM', isMandatory: true },
    { id: 'c5', label: 'Ensure multimedia projector area is clean and switches off', category: 'CLASSROOM', isMandatory: false },
  ],
  LAB: [
    { id: 'l1', label: 'Sanitize computer / lab workbenches & ESD mats', category: 'LAB', isMandatory: true },
    { id: 'l2', label: 'Clean antistatic floor surface with specialized dust-mop', category: 'LAB', isMandatory: true },
    { id: 'l3', label: 'Empty dry waste and hazardous chemical disposal bins', category: 'LAB', isMandatory: true },
    { id: 'l4', label: 'Wipe down equipment exterior & monitor surfaces', category: 'LAB', isMandatory: true },
    { id: 'l5', label: 'Verify emergency eyewash station clearance', category: 'LAB', isMandatory: false },
  ],
  CANTEEN: [
    { id: 'k1', label: 'Wipe down and disinfect dining tables and benches', category: 'CANTEEN', isMandatory: true },
    { id: 'k2', label: 'Mop food spills & degrease dining floor surface', category: 'CANTEEN', isMandatory: true },
    { id: 'k3', label: 'Clear dish return racks and tray deposit counter', category: 'CANTEEN', isMandatory: true },
    { id: 'k4', label: 'Empty food waste bins and spray odor neutralizer', category: 'CANTEEN', isMandatory: true },
    { id: 'k5', label: 'Sanitize public hand-washing washbasins', category: 'CANTEEN', isMandatory: true },
  ],
  CORRIDOR: [
    { id: 'r1', label: 'Sweep corridor floors, ramps, and stairwells', category: 'CORRIDOR', isMandatory: true },
    { id: 'r2', label: 'Empty hallway waste receptacles and recycling bins', category: 'CORRIDOR', isMandatory: true },
    { id: 'r3', label: 'Wipe handrails, staircase railings & notice boards', category: 'CORRIDOR', isMandatory: true },
    { id: 'r4', label: 'Mop floor tiles with antislip disinfectant', category: 'CORRIDOR', isMandatory: true },
  ],
  OUTDOOR: [
    { id: 'o1', label: 'Clear litter, fallen leaves, and debris from walkways', category: 'OUTDOOR', isMandatory: true },
    { id: 'o2', label: 'Empty external campus garbage bins and replace sacks', category: 'OUTDOOR', isMandatory: true },
    { id: 'o3', label: 'Inspect drainage grates and clear blockages', category: 'OUTDOOR', isMandatory: true },
    { id: 'o4', label: 'Ensure parade ground & entry plazas are spotless', category: 'OUTDOOR', isMandatory: false },
  ],
  HOSTEL: [
    { id: 'h1', label: 'Mop hostel corridor and common room floors', category: 'HOSTEL', isMandatory: true },
    { id: 'h2', label: 'Sanitize shared washroom and ablution facilities', category: 'HOSTEL', isMandatory: true },
    { id: 'h3', label: 'Clear dormitory trash collection points', category: 'HOSTEL', isMandatory: true },
    { id: 'h4', label: 'Disinfect staircase railings and water cooler area', category: 'HOSTEL', isMandatory: true },
  ],
};

export function getChecklistForCategory(category?: string): ChecklistItem[] {
  if (!category) return FACILITY_CHECKLISTS.CLASSROOM;
  const upper = category.toUpperCase();
  for (const [key, items] of Object.entries(FACILITY_CHECKLISTS)) {
    if (upper.includes(key) || key.includes(upper)) {
      return items;
    }
  }
  return FACILITY_CHECKLISTS.CLASSROOM;
}

