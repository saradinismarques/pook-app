import type { Book } from '@/types/book';
import type { BookList } from '@/types/list';

const ENDPOINT = 'https://api.hardcover.app/v1/graphql';
const TOKEN = process.env.EXPO_PUBLIC_HARDCOVER_API_TOKEN;
const PAGE_SIZE = 20;
const MAX_OFFSET = 2000;

const BOOK_FIELDS = `
  id
  title
  subtitle
  description
  pages
  release_date
  image { url }
  contributions { author { name } }
`;

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
    ) { ${BOOK_FIELDS} }
  }
`;

const LIST_FIELDS = `
  id
  name
  description
  books_count
  likes_count
  featured
  user { username }
`;

const PUBLIC_LISTS_QUERY = `
  query PublicLists($limit: Int!, $offset: Int!) {
    lists(
      where: { public: { _eq: true }, books_count: { _gt: 0 }, name: { _is_null: false } }
      order_by: [{ featured: desc }, { likes_count: desc }]
      limit: $limit
      offset: $offset
    ) { ${LIST_FIELDS} }
    lists_aggregate(
      where: { public: { _eq: true }, books_count: { _gt: 0 }, name: { _is_null: false } }
    ) { aggregate { count } }
  }
`;

const SEARCH_LISTS_QUERY = `
  query SearchLists($query: String!, $page: Int!, $perPage: Int!) {
    search(query: $query, query_type: "list", page: $page, per_page: $perPage) {
      error
      results
    }
  }
`;

const HYDRATE_LISTS_QUERY = `
  query HydrateLists($ids: [Int!]!) {
    lists(where: { id: { _in: $ids }, public: { _eq: true } }) { ${LIST_FIELDS} }
  }
`;

const SEARCH_BOOKS_QUERY = `
  query SearchBooks($query: String!, $page: Int!, $perPage: Int!) {
    search(query: $query, query_type: "Book", page: $page, per_page: $perPage) {
      error
      results
    }
  }
`;

const HYDRATE_BOOKS_QUERY = `
  query HydrateBooks($ids: [Int!]!) {
    books(
      where: { id: { _in: $ids }, is_partial_book: { _neq: true } }
    ) { ${BOOK_FIELDS} }
  }
`;

const LIST_BOOKS_QUERY = `
  query ListBooks($listId: Int!, $limit: Int!, $offset: Int!) {
    list_books(
      where: { list_id: { _eq: $listId } }
      order_by: [{ position: asc }, { id: asc }]
      limit: $limit
      offset: $offset
    ) { book { ${BOOK_FIELDS} } }
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

type HardcoverList = {
  id?: number;
  name?: string;
  description?: string | null;
  books_count?: number;
  likes_count?: number;
  featured?: boolean;
  user?: { username?: string } | null;
};

type HardcoverListBook = {
  book?: HardcoverBook | null;
};

type SearchListDocument = {
  id?: string | number;
  name?: string;
  books_count?: number;
  likes_count?: number;
  user?: { username?: string } | null;
};

type SearchHit = {
  document?: SearchListDocument | null;
};

type SearchResults = {
  found?: number;
  hits?: SearchHit[] | null;
};

type SearchPayload = {
  error?: string | null;
  results?: SearchResults | null;
};

const SEARCH_PAGE_SIZE = 25;

type HardcoverPayload<T> = {
  data?: T;
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

function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  signal?: AbortSignal
): Promise<T> {
  if (!TOKEN) {
    return Promise.reject(
      new HardcoverError(
        'API token is missing. Add EXPO_PUBLIC_HARDCOVER_API_TOKEN to your .env and restart with --clear.',
        null
      )
    );
  }

  return fetch(ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  })
    .then(async (response) => {
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new HardcoverError(
            'The API token was rejected. Check your token.',
            response.status
          );
        }
        if (response.status === 429) {
          throw new HardcoverError(
            'Rate limit reached. Please wait a moment and try again.',
            429
          );
        }
        throw new HardcoverError(`Request failed (${response.status}).`, response.status);
      }

      const payload = (await response.json()) as HardcoverPayload<T>;

      if (payload.errors?.length) {
        throw new HardcoverError(payload.errors[0]?.message ?? 'The server returned an error.');
      }

      if (!payload.data) {
        throw new HardcoverError('The server returned an unexpected response.');
      }

      return payload.data;
    })
    .catch((error) => {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      if (error instanceof HardcoverError) {
        throw error;
      }
      throw new HardcoverError('Could not reach the server. Check your connection.');
    });
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

function isBook(value: Book | null): value is Book {
  return value !== null;
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

function mapList(list: HardcoverList): BookList | null {
  const name = list.name?.trim();
  if (list.id === undefined || list.id === null || !name) {
    return null;
  }
  return {
    id: list.id,
    name,
    description: list.description?.trim() || undefined,
    booksCount: list.books_count ?? 0,
    likesCount: list.likes_count ?? 0,
    featured: Boolean(list.featured),
    owner: list.user?.username?.trim() || undefined,
  };
}

export async function fetchBookBatch(signal?: AbortSignal): Promise<Book[]> {
  const offset = Math.floor(Math.random() * MAX_OFFSET);

  const data = await graphqlRequest<{ books?: HardcoverBook[] }>(
    DISCOVER_QUERY,
    { limit: PAGE_SIZE, offset },
    signal
  );

  return (data.books ?? [])
    .map(mapBook)
    .filter((book): book is Book => book !== null);
}

export type FetchPopularBooksOptions = {
  limit?: number;
  offset?: number;
};

export async function fetchPopularBooks(
  { limit = PAGE_SIZE, offset = 0 }: FetchPopularBooksOptions = {},
  signal?: AbortSignal
): Promise<Book[]> {
  const data = await graphqlRequest<{ books?: HardcoverBook[] }>(
    DISCOVER_QUERY,
    { limit, offset },
    signal
  );

  return (data.books ?? [])
    .map(mapBook)
    .filter((book): book is Book => book !== null);
}

export type FetchPublicListsOptions = {
  limit?: number;
  offset?: number;
};

export async function fetchPublicLists(
  { limit = 25, offset = 0 }: FetchPublicListsOptions = {},
  signal?: AbortSignal
): Promise<{ lists: BookList[]; total: number }> {
  const data = await graphqlRequest<{
    lists?: HardcoverList[];
    lists_aggregate?: { aggregate?: { count?: number } };
  }>(PUBLIC_LISTS_QUERY, { limit, offset }, signal);

  const lists = (data.lists ?? [])
    .map(mapList)
    .filter((list): list is BookList => list !== null);

  return { lists, total: data.lists_aggregate?.aggregate?.count ?? 0 };
}

export type FetchListBooksOptions = {
  listId: number;
  limit?: number;
  offset?: number;
};

export async function fetchListBooks(
  { listId, limit = PAGE_SIZE, offset = 0 }: FetchListBooksOptions,
  signal?: AbortSignal
): Promise<Book[]> {
  const data = await graphqlRequest<{ list_books?: HardcoverListBook[] }>(
    LIST_BOOKS_QUERY,
    { listId, limit, offset },
    signal
  );

  return (data.list_books ?? [])
    .map((item) => item.book)
    .filter((book): book is HardcoverBook => Boolean(book))
    .map(mapBook)
    .filter(isBook);
}

export type SearchListsOptions = {
  query: string;
  page?: number;
  perPage?: number;
};

export type SearchListsResult = {
  lists: BookList[];
  total: number;
};

export async function searchLists(
  { query, page = 1, perPage = SEARCH_PAGE_SIZE }: SearchListsOptions,
  signal?: AbortSignal
): Promise<SearchListsResult> {
  const data = await graphqlRequest<{ search?: SearchPayload }>(
    SEARCH_LISTS_QUERY,
    { query, page, perPage },
    signal
  );

  const search = data.search;
  if (search?.error) {
    throw new HardcoverError(search.error);
  }

  const results = search?.results;
  const hits = results?.hits ?? [];
  const total = results?.found ?? 0;

  const ids = hits
    .map((hit) => Number(hit?.document?.id))
    .filter((id) => Number.isFinite(id));

  if (ids.length === 0) {
    return { lists: [], total };
  }

  const hydrated = await graphqlRequest<{ lists?: HardcoverList[] }>(
    HYDRATE_LISTS_QUERY,
    { ids },
    signal
  );

  const byId = new Map<number, BookList>();
  for (const list of hydrated.lists ?? []) {
    const mapped = mapList(list);
    if (mapped) {
      byId.set(mapped.id, mapped);
    }
  }

  const lists = ids
    .map((id) => byId.get(id))
    .filter((list): list is BookList => list !== undefined);

  return { lists, total };
}

export type SearchBooksOptions = {
  query: string;
  page?: number;
  perPage?: number;
};

export type SearchBooksResult = {
  books: Book[];
  total: number;
};

export async function searchBooks(
  { query, page = 1, perPage = SEARCH_PAGE_SIZE }: SearchBooksOptions,
  signal?: AbortSignal
): Promise<SearchBooksResult> {
  const data = await graphqlRequest<{ search?: SearchPayload }>(
    SEARCH_BOOKS_QUERY,
    { query, page, perPage },
    signal
  );

  const search = data.search;
  if (search?.error) {
    throw new HardcoverError(search.error);
  }

  const results = search?.results;
  const hits = results?.hits ?? [];
  const total = results?.found ?? 0;

  const ids = hits
    .map((hit) => Number(hit?.document?.id))
    .filter((id) => Number.isFinite(id));

  if (ids.length === 0) {
    return { books: [], total };
  }

  const hydrated = await graphqlRequest<{ books?: HardcoverBook[] }>(
    HYDRATE_BOOKS_QUERY,
    { ids },
    signal
  );

  const byId = new Map<string, Book>();
  for (const raw of hydrated.books ?? []) {
    const book = mapBook(raw);
    if (book) {
      byId.set(book.id, book);
    }
  }

  const books = ids
    .map((id) => byId.get(String(id)))
    .filter((book): book is Book => book !== undefined);

  return { books, total };
}
