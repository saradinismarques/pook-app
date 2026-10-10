export type BookList = {
  id: number;
  name: string;
  description?: string;
  booksCount: number;
  likesCount: number;
  featured: boolean;
  owner?: string;
};
