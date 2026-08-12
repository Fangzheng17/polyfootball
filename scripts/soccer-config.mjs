// Which Polymarket tags the soccer dashboard + odds logger read from.
//
// Verified 2026-08-11 by inspecting live match events: every soccer match
// carries tag 100350 ("Soccer"), with the specific competition expressed as a
// SERIES (europa-conference-league, la-liga-2025, soccer-lec, …) rather than a
// per-league tag. So one tag sweep mirrors Polymarket's whole soccer section —
// 311 matches across 40 competitions at time of writing — and new leagues
// appear automatically without a hardcoded list.
//
// NOTE: /events/keyset caps at 100 per page; callers MUST follow next_cursor
// or they will silently see only one competition.
export const SOCCER_TAG_IDS = [100350];

// Log every market type (props, corners, halves…) instead of just the
// match-level ones. Much larger logs; turn on only if you want prop-level
// odds history too.
export const LOG_ALL_MARKET_TYPES = false;
