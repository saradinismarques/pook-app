export type Book = {
  id: string;
  title: string;
  authors: string[];
  description?: string;
  thumbnail?: string;
  publishedDate?: string;
  pageCount?: number;
  rating?: number;
  usersCount?: number;
  categories: string[];
};

export type SwipeDirection = 'left' | 'right';
