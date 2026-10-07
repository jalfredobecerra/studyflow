import "server-only";

export type GeneratedFlashcard = {
  front: string;
  back: string;
};

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function createQuestionFromSentence(sentence: string): string {
  const cleanedSentence = cleanText(sentence);

  const definitionMatch = cleanedSentence.match(
    /^(.{2,60}?)\s+(?:is|are|means|refers to)\s+(.+)$/i
  );

  if (definitionMatch) {
    const subject = definitionMatch[1].trim();

    return `What is ${subject}?`;
  }

  const words = cleanedSentence.split(" ");

  const preview =
    words.length > 8 ? `${words.slice(0, 8).join(" ")}...` : cleanedSentence;

  return `Explain this idea: ${preview}`;
}

export function generateFlashcardsFromNotes(
  notes: string
): GeneratedFlashcard[] {
  const normalizedNotes = notes.replace(/\r/g, "").replace(/[•●▪]/g, "\n");

  const lines = normalizedNotes
    .split("\n")
    .map((line) => cleanText(line))
    .filter((line) => line.length >= 20);

  const cards: GeneratedFlashcard[] = [];

  for (const line of lines) {
    const colonIndex = line.indexOf(":");

    if (colonIndex > 1 && colonIndex < 70) {
      const front = cleanText(line.slice(0, colonIndex));
      const back = cleanText(line.slice(colonIndex + 1));

      if (front.length >= 2 && back.length >= 10) {
        cards.push({
          front: `What is ${front}?`,
          back,
        });

        continue;
      }
    }

    const sentences = line
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => cleanText(sentence))
      .filter((sentence) => sentence.length >= 30);

    for (const sentence of sentences) {
      cards.push({
        front: createQuestionFromSentence(sentence),
        back: sentence,
      });
    }
  }

  if (cards.length === 0) {
    const sentences = normalizedNotes
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => cleanText(sentence))
      .filter((sentence) => sentence.length >= 30);

    for (const sentence of sentences) {
      cards.push({
        front: createQuestionFromSentence(sentence),
        back: sentence,
      });
    }
  }

  const uniqueCards = cards.filter(
    (card, index, allCards) =>
      allCards.findIndex(
        (candidate) =>
          candidate.front.toLowerCase() === card.front.toLowerCase()
      ) === index
  );

  return uniqueCards.slice(0, 20);
}
