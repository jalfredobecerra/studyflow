export type GeneratedFlashcard = {
  front: string;
  back: string;
};

const MAX_CARDS = 20;

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function removeListMarker(value: string): string {
  return value.replace(/^\s*(?:[-*]|\d+[.)])\s+/, "");
}

function normalizeSubject(subject: string): string {
  return subject.replace(/^(A|An|The)\s+/, (match) => match.toLowerCase());
}

function createCard(text: string): GeneratedFlashcard | null {
  const sentence = cleanText(removeListMarker(text)).replace(/[.!?]$/, "");

  if (sentence.length < 25) {
    return null;
  }

  const colonMatch = sentence.match(/^([^:]{2,60}):\s*(.{15,})$/);

  if (colonMatch) {
    const term = cleanText(colonMatch[1]);
    const definition = cleanText(colonMatch[2]);

    return {
      front: `What is ${normalizeSubject(term)}?`,
      back: definition,
    };
  }

  const relationshipMatch = sentence.match(
    /^(.{2,60}?)\s+(is|are|means|refers to|allow|allows|enable|enables|store|stores|contain|contains|use|uses)\s+(.+)$/i
  );

  if (!relationshipMatch) {
    return null;
  }

  const subject = cleanText(relationshipMatch[1]);
  const verb = relationshipMatch[2].toLowerCase();
  const explanation = cleanText(relationshipMatch[3]);

  if (subject.split(" ").length > 8 || explanation.length < 15) {
    return null;
  }

  const normalizedSubject = normalizeSubject(subject);

  let question: string;

  if (["is", "are", "means", "refers to"].includes(verb)) {
    question = `What is ${normalizedSubject}?`;
  } else if (verb.endsWith("s")) {
    const baseVerb = verb === "uses" ? "use" : verb.slice(0, -1);

    question = `What does ${normalizedSubject} ${baseVerb}?`;
  } else {
    question = `What do ${normalizedSubject} ${verb}?`;
  }

  return {
    front: question,
    back: sentence,
  };
}

export function generateFlashcardsFromNotes(
  notes: string
): GeneratedFlashcard[] {
  const normalized = notes.replace(/\r/g, "").replace(/[•●▪]/g, "\n");

  const segments = normalized
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z])/)
    .map(cleanText)
    .filter(Boolean);

  const cards: GeneratedFlashcard[] = [];
  const questions = new Set<string>();

  for (const segment of segments) {
    const card = createCard(segment);

    if (!card) {
      continue;
    }

    const questionKey = card.front.toLowerCase();

    if (questions.has(questionKey)) {
      continue;
    }

    questions.add(questionKey);
    cards.push(card);

    if (cards.length >= MAX_CARDS) {
      break;
    }
  }

  return cards;
}
