import { AIClassificationResult } from '../types/attendance';
import edomModelData from './model-edom.json';

type SentimentModel = {
  schema_version: number;
  preprocessing: string;
  algorithm?: string;
  status?: string;
  labels: string[];
  aliases: Record<string, string>;
  vocabulary: Record<string, number>;
  idf: number[];
  weights: number[][];
  bias: number[];
};

type LocalPrediction = {
  label: string | null;
  status: 'predicted' | 'unknown_vocabulary' | 'empty_input';
  scores: number[] | null;
};

const edomModel = edomModelData as unknown as SentimentModel;

function runLocalSentimentClassifier(text: string): LocalPrediction {
  if (
    edomModel.schema_version !== 1 ||
    ![
      'ascii_lowercase_words_unigram_bigram_sublinear_tf_l2_v1',
      'unicode_nfkd_ascii_words_unigram_bigram_sublinear_tf_l2_v1',
    ].includes(edomModel.preprocessing)
  ) {
    throw new Error('Unsupported sentiment model format');
  }

  const owns = (obj: Record<string, unknown>, key: string) =>
    Object.prototype.hasOwnProperty.call(obj, key);

  const normalized = edomModel.preprocessing.startsWith('unicode_')
    ? text
        .replace(/<[^>]*>/g, ' ')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
    : text.toLowerCase();

  const rawWords = normalized.match(/[a-z0-9]+/g) ?? [];
  const words = rawWords.map((w) =>
    owns(edomModel.aliases, w) ? edomModel.aliases[w] : w
  );
  const grams = words.concat(
    words.slice(1).map((w, i) => `${words[i]} ${w}`)
  );

  const counts = new Map<number, number>();
  for (const gram of grams) {
    if (owns(edomModel.vocabulary, gram)) {
      const index = edomModel.vocabulary[gram];
      counts.set(index, (counts.get(index) ?? 0) + 1);
    }
  }

  if (counts.size === 0) {
    return {
      label: null,
      status: words.length > 0 ? 'unknown_vocabulary' : 'empty_input',
      scores: null,
    };
  }

  const values: [number, number][] = Array.from(counts, ([i, count]) => [
    i,
    (1 + Math.log(count)) * edomModel.idf[i],
  ]);
  const norm = Math.sqrt(
    values.reduce((sum, pair) => sum + pair[1] ** 2, 0)
  );
  const scores = edomModel.weights.map((weights, c) =>
    values.reduce(
      (score, [i, value]) => score + (weights[i] * value) / norm,
      edomModel.bias[c]
    )
  );

  const bestIndex = scores.indexOf(Math.max(...scores));
  return {
    label: edomModel.labels[bestIndex] ?? null,
    status: 'predicted',
    scores,
  };
}

function computeConfidenceFromScores(scores: number[] | null): number | undefined {
  if (!scores || scores.length === 0) return undefined;
  const maxScore = Math.max(...scores);
  const expScores = scores.map((s) => Math.exp(s - maxScore));
  const sumExp = expScores.reduce((acc, val) => acc + val, 0);
  if (sumExp <= 0) return undefined;
  const maxProb = Math.max(...expScores) / sumExp;
  return Math.round(maxProb * 100) / 100;
}

export async function classifyPermissionReason(
  reason: string
): Promise<AIClassificationResult> {
  const trimmed = reason.trim();
  if (!trimmed) {
    return { category: 'tidak_diketahui' };
  }

  const apiUrl = process.env.EXPO_PUBLIC_AI_API_URL?.trim();
  const apiKey = process.env.EXPO_PUBLIC_AI_API_KEY?.trim();

  if (apiUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: trimmed, text: trimmed }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as {
          category?: string;
          label?: string;
          confidence?: number;
        };
        const category = data.category ?? data.label;
        if (category && typeof category === 'string') {
          return {
            category,
            confidence:
              typeof data.confidence === 'number' ? data.confidence : undefined,
          };
        }
      }
    } catch {
      // Fallback ke model lokal atau 'tidak_diketahui' jika API gagal merespons
    }
  }

  try {
    const localPred = runLocalSentimentClassifier(trimmed);
    if (!localPred.label) {
      return { category: 'tidak_diketahui' };
    }
    return {
      category: localPred.label,
      confidence: computeConfidenceFromScores(localPred.scores),
    };
  } catch {
    return { category: 'tidak_diketahui' };
  }
}
