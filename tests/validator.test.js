import { expect, test, describe } from 'vitest';
import { validateSquad } from '../src/validator.js';
import { roster, defaultSelectedIds } from '../src/data.js';

describe('validateSquad Reference Validation', () => {
  test('Returns INVALID_SELECTION_REFERENCE for duplicate IDs', () => {
    const selected = ['S01', 'S01', 'S02', 'S03', 'S04', 'S05', 'S06'];
    const result = validateSquad(selected, roster);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(['INVALID_SELECTION_REFERENCE']);
  });

  test('Returns INVALID_SELECTION_REFERENCE for unknown IDs', () => {
    const selected = ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S99'];
    const result = validateSquad(selected, roster);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(['INVALID_SELECTION_REFERENCE']);
  });
});

describe('validateSquad Basic Rules', () => {
  test('Baseline selection S01-S07 is valid', () => {
    const result = validateSquad(defaultSelectedIds, roster);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    
    // Verify all required counts as per Acceptance Criteria
    expect(result.counts.size).toBe(7);
    expect(result.counts.positions.GOALKEEPER).toBe(1);
    expect(result.counts.positions.DEFENDER).toBe(2);
    expect(result.counts.positions.FORWARD).toBe(2);
    expect(result.counts.positions.UTILITY).toBe(2);
    expect(result.counts.cohorts.YEAR_2).toBe(4);
    expect(result.counts.cohorts.YEAR_3).toBe(3);
  });

  test('Catches missing players (SQUAD_SIZE_MUST_BE_7)', () => {
    const selected = ['S01', 'S02', 'S03'];
    const result = validateSquad(selected, roster);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('SQUAD_SIZE_MUST_BE_7');
    expect(result.errors).toContain('MINIMUM_FORWARDS_NOT_MET'); // Also happens with this small squad
  });

  test('Catches missing GOALKEEPER', () => {
    // Replace S01 (GK) with S08 (FWD)
    const selected = ['S08', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07'];
    const result = validateSquad(selected, roster);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('GOALKEEPER_COUNT_MUST_BE_1');
  });

  test('Catches missing DEFENDER', () => {
    // Replace S02 (DEF) with S08 (FWD)
    const selected = ['S01', 'S08', 'S03', 'S04', 'S05', 'S06', 'S07'];
    const result = validateSquad(selected, roster);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('MINIMUM_DEFENDERS_NOT_MET');
  });

  test('Catches missing FORWARD', () => {
    // Replace S04 (FWD) with S09 (GK)
    const selected = ['S01', 'S02', 'S03', 'S09', 'S05', 'S06', 'S07'];
    const result = validateSquad(selected, roster);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('MINIMUM_FORWARDS_NOT_MET');
    // We also just added an extra GK, so it should catch that too
    expect(result.errors).toContain('GOALKEEPER_COUNT_MUST_BE_1');
  });

  test('Catches unavailable players and reports them in roster order', () => {
    // S08 is unavailable. Let's replace S07 with S08.
    const selected = ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S08'];
    const result = validateSquad(selected, roster);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('PLAYER_UNAVAILABLE: S08');
  });

  test('Acceptance Criteria: Replace S07 with S08 (Triggers Unavailable and Cohort Limit)', () => {
    // S07 is YEAR_3 UTILITY (Available)
    // S08 is YEAR_2 FORWARD (Unavailable)
    // The default selection already has 4 YEAR_2 players (S01, S02, S04, S06).
    // Swapping S07 for S08 adds a 5th YEAR_2 player and an unavailable player.
    const selected = ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S08'];
    const result = validateSquad(selected, roster);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual([
      'PLAYER_UNAVAILABLE: S08',
      'COHORT_LIMIT_EXCEEDED: YEAR_2 has 5, maximum 4'
    ]);
  });

  test('Acceptance Criteria: Six-player case (remove S07)', () => {
    // Starting with baseline and removing S07 (UTILITY)
    const selected = ['S01', 'S02', 'S03', 'S04', 'S05', 'S06'];
    const result = validateSquad(selected, roster);
    
    // The only violation should be SQUAD_SIZE_MUST_BE_7
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(['SQUAD_SIZE_MUST_BE_7']);
  });

  test('Proves exactly 4 players in a cohort is allowed (no limit exceeded)', () => {
    // Baseline has exactly 4 YEAR_2 players and 3 YEAR_3 players
    const result = validateSquad(defaultSelectedIds, roster);
    expect(result.counts.cohorts.YEAR_2).toBe(4);
    expect(result.errors.find(e => e.includes('COHORT_LIMIT_EXCEEDED'))).toBeUndefined();
  });

  test('Proves UTILITY does not satisfy the defender minimum', () => {
    // Replace S02 (DEFENDER) with another UTILITY if possible, or just remove S02 and add another UTILITY to keep size 7. 
    // We already have S06 and S07 as UTILITY.
    // Let's replace S02 (DEF) with a duplicate S06 just for testing the position count logic, 
    // but duplicate IDs fail early.
    // So we'll use a custom roster array just for this test, or we can just remove S02 and add a dummy valid ID if one existed.
    // Actually, we only have 9 players. 
    // Let's replace S02 (DEF) with S09 (GK). 
    // Wait, the prompt says "prove UTILITY does not satisfy". 
    // The baseline has S06 and S07 (UTILITY). S02 and S03 are DEFENDER.
    // If we remove S02, we only have 1 DEFENDER. The UTILITY players (S06, S07) should NOT count as DEFENDERs.
    const selected = ['S01', 'S03', 'S04', 'S05', 'S06', 'S07', 'S09']; // 7 players, 1 DEF, 2 FWD, 2 UTL, 2 GK
    const result = validateSquad(selected, roster);
    
    expect(result.counts.positions.UTILITY).toBe(2);
    expect(result.counts.positions.DEFENDER).toBe(1); // Only S03
    expect(result.errors).toContain('MINIMUM_DEFENDERS_NOT_MET');
  });

  test('Proves UTILITY does not satisfy the forward minimum', () => {
    // Replace S04 (FORWARD) with S09 (GK)
    const selected = ['S01', 'S02', 'S03', 'S05', 'S06', 'S07', 'S09']; // 7 players, 2 DEF, 1 FWD, 2 UTL, 2 GK
    const result = validateSquad(selected, roster);
    
    expect(result.counts.positions.UTILITY).toBe(2);
    expect(result.counts.positions.FORWARD).toBe(1); // Only S05
    expect(result.errors).toContain('MINIMUM_FORWARDS_NOT_MET');
  });
});
