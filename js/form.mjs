// Filmed self-review checkpoint (mastery item 6, council 08-24). DOM-free
// scheduling. MIDI cannot see posture; this card turns that honest ceiling
// into a recurring 60-second self-check. Pull, never nag: it appears as a
// dismissible card every ~7 PRACTICE days, and the app records no video.

export const FORM_CHECKS = [
  'Balanced seat and feet',
  'Neutral wrist',
  'Relaxed shoulders',
  'Curved fingers',
  'No visible tension',
];

export const FORM_EVERY_PRACTICE_DAYS = 7;

// Standing copy, verbatim per the council ruling. Do not soften it.
export const FORM_TEACHER_LINE = 'recurring pain or uncertainty means show a human teacher';

export const FORM_ANGLE_LINE = 'Camera angle: torso, forearms, wrists and keys all in frame.';

// days: the state.days practice-day list ('YYYY-MM-DD' strings).
// lastDoneDay: the day the checkpoint was last completed, or null.
// Due when 7 practice days have happened since (strictly after) the last one.
export function formDue(lastDoneDay, days) {
  const since = lastDoneDay ? days.filter((d) => d > lastDoneDay) : days;
  return since.length >= FORM_EVERY_PRACTICE_DAYS;
}
