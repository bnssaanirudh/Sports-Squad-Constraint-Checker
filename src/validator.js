export function validateSquad(selectedIds, roster) {
  // Initialize zeroed counts
  const counts = {
    size: 0,
    positions: { GOALKEEPER: 0, DEFENDER: 0, FORWARD: 0, UTILITY: 0 },
    cohorts: { YEAR_2: 0, YEAR_3: 0 }
  };

  // 1. Reference Validation: Check for duplicates
  const uniqueIds = new Set(selectedIds);
  if (uniqueIds.size !== selectedIds.length) {
    return { isValid: false, errors: ['INVALID_SELECTION_REFERENCE'], counts };
  }

  // 1. Reference Validation: Check for unknown IDs
  const rosterIds = new Set(roster.map(p => p.id));
  for (const id of selectedIds) {
    if (!rosterIds.has(id)) {
      return { isValid: false, errors: ['INVALID_SELECTION_REFERENCE'], counts };
    }
  }

  // Calculate actual counts if references are valid
  counts.size = selectedIds.length;
  for (const id of selectedIds) {
    const player = roster.find(p => p.id === id);
    counts.positions[player.position]++;
    counts.cohorts[player.cohort]++;
  }

  const errors = [];

  if (counts.size !== 7) {
    errors.push('SQUAD_SIZE_MUST_BE_7');
  }
  if (counts.positions.GOALKEEPER !== 1) {
    errors.push('GOALKEEPER_COUNT_MUST_BE_1');
  }
  if (counts.positions.DEFENDER < 2) {
    errors.push('MINIMUM_DEFENDERS_NOT_MET');
  }
  if (counts.positions.FORWARD < 2) {
    errors.push('MINIMUM_FORWARDS_NOT_MET');
  }

  // Unavailable Players (must be in roster order)
  for (const player of roster) {
    if (uniqueIds.has(player.id) && player.availability === 'UNAVAILABLE') {
      errors.push(`PLAYER_UNAVAILABLE: ${player.id}`);
    }
  }

  // Cohort Limits (must be in YEAR_2, YEAR_3 order)
  if (counts.cohorts.YEAR_2 > 4) {
    errors.push(`COHORT_LIMIT_EXCEEDED: YEAR_2 has ${counts.cohorts.YEAR_2}, maximum 4`);
  }
  if (counts.cohorts.YEAR_3 > 4) {
    errors.push(`COHORT_LIMIT_EXCEEDED: YEAR_3 has ${counts.cohorts.YEAR_3}, maximum 4`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    counts
  };
}
