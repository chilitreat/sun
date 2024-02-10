DROP TABLE IF EXISTS articles;
CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now')),
  title TEXT,
  content TEXT
);
INSERT INTO articles (id, title, content)VALUES
  ('1', 'Hello World', 'This is my first blog post.'),
  ('2', 'Goodbye World', 'This is my last blog post.'),
  ('3', 'Hello Again', 'This is my second blog post.');

SELECT * FROM articles;