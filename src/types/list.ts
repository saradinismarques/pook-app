import type { Book } from '@/types/book';

export type BookList = {
  id: number;
  name: string;
  description?: string;
  booksCount: number;
  likesCount: number;
  featured: boolean;
  owner?: string;
};

export type UserList = {
  id: string;
  name: string;
  books: Book[];
  createdAt: number;
  updatedAt: number;
};
