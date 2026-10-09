import { describe, expect, it } from 'vitest';

import { generateFlashcardsFromNotes } from './flashcards';

describe('Flashcard generation', () => {
  it('generates a flashcard from a definition', () => {
    const notes =
      'Encapsulation: A programming principle that restricts direct access to internal object data.';

    const cards = generateFlashcardsFromNotes(notes);

    expect(cards).toHaveLength(1);
    expect(cards[0].front).toBe('What is Encapsulation?');
    expect(cards[0].back).toContain(
      'restricts direct access',
    );
  });

  it('generates a question from an explanatory sentence', () => {
    const notes =
      'Polymorphism allows different objects to respond to the same method in different ways.';

    const cards = generateFlashcardsFromNotes(notes);

    expect(cards).toHaveLength(1);
    expect(cards[0].front).toBe(
      'What does Polymorphism allow?',
    );
  });

  it('does not generate duplicate questions', () => {
    const notes = `
      Encapsulation: A programming principle that protects internal information.
      Encapsulation: A programming principle that restricts direct access to internal data.
    `;

    const cards = generateFlashcardsFromNotes(notes);

    expect(cards).toHaveLength(1);
  });

  it('rejects vague or insufficient material', () => {
    const cards = generateFlashcardsFromNotes(
      'Programming stuff. Important topic. Study this.',
    );

    expect(cards).toHaveLength(0);
  });

  it('generates no more than 20 flashcards', () => {
    const notes = Array.from(
      { length: 30 },
      (_, index) =>
        `Topic ${index + 1}: This explanation describes an important programming concept with enough detail.`,
    ).join('\n');

    const cards = generateFlashcardsFromNotes(notes);

    expect(cards).toHaveLength(20);
  });
});