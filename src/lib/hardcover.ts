import type { Book } from '@/types/book';

const ENDPOINT = 'https://api.hardcover.app/v1/graphql';
const TOKEN = process.env.EXPO_PUBLIC_HARDCOVER_API_TOKEN;
const PAGE_SIZE = 20;
const MAX_OFFSET = 2000;

const DISCOVER_QUERY = `
  query DiscoverBooks($limit: Int!, $offset: Int!) {
    books(
      where: {
        description: { _is_null: false }
        image_id: { _is_null: false }
        is_partial_book: { _neq: true }
      }
      order_by: { users_count: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      title
      subtitle
      description
      pages
      release_date
      image { url }
      contributions { author { name } }
    }
  }
`;

type HardcoverContribution = {
  author?: { name?: string } | null;
};

type HardcoverBook = {
  id?: number;
  title?: string;
  subtitle?: string;
  description?: string;
  pages?: number;
  release_date?: string;
  image?: { url?: string } | null;
  contributions?: HardcoverContribution[];
};

type HardcoverResponse = {
  data?: { books?: HardcoverBook[] };
  errors?: { message?: string }[];
};

export class HardcoverError extends Error {
  readonly code: number | null;

  constructor(message: string, code: number | null = null) {
    super(message);
    this.name = 'HardcoverError';
    this.code = code;
  }
}

function cleanDescription(description?: string): string | undefined {
  if (!description) {
    return undefined;
  }
  const cleaned = description
    .replace(/<[^>]*>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function mapBook(book: HardcoverBook): Book | null {
  const title = book.title?.trim();
  if (book.id === undefined || book.id === null || !title) {
    return null;
  }
  const authors =
    book.contributions
      ?.map((contribution) => contribution.author?.name?.trim())
      .filter((name): name is string => Boolean(name)) ?? [];

  return {
    id: String(book.id),
    title: book.subtitle ? `${title}: ${book.subtitle}` : title,
    authors: authors.length ? authors : ['Unknown author'],
    description: cleanDescription(book.description),
    thumbnail: book.image?.url,
    publishedDate: book.release_date,
    pageCount: book.pages,
    categories: [],
  };
}

export async function fetchBookBatch(signal?: AbortSignal): Promise<Book[]> {
  if (!TOKEN) {
    throw new HardcoverError(
      'Hardcover API token is missing. Add EXPO_PUBLIC_HARDCOVER_API_TOKEN to your .env and restart with --clear.',
      null
    );
  }

  const offset = Math.floor(Math.random() * MAX_OFFSET);

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        query: DISCOVER_QUERY,
        variables: { limit: PAGE_SIZE, offset },
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    throw new HardcoverError('Could not reach Hardcover. Check your connection.');
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new HardcoverError('Hardcover rejected the API token. Check your token.', response.status);
    }
    if (response.status === 429) {
      throw new HardcoverError(
        'Hardcover rate limit reached. Please wait a moment and try again.',
        429
      );
    }
    throw new HardcoverError(`Hardcover request failed (${response.status}).`, response.status);
  }

  const payload = (await response.json()) as HardcoverResponse;

  if (payload.errors?.length) {
    throw new HardcoverError(payload.errors[0]?.message ?? 'Hardcover returned an error.');
  }

  const books = (payload.data?.books ?? [])
    .map(mapBook)
    .filter((book): book is Book => book !== null);

  return books;
}
