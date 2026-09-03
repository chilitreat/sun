// TypeScript 型定義

export type Meta = {
  emoji: string;
  title: string;
  author: string;
  created_at: string;
  hashtags?: string[] | string;
};

export type PostWithNavigation = {
  id: string;
  frontmatter: Meta;
  previousPost?: { id: string; title: string };
  nextPost?: { id: string; title: string };
};

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
