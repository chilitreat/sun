  id TEXT PRIMARY KEY,
CREATE TABLE articles (
  created_at TEXT DEFAULT (datetime('now')),
  title TEXT,
  content TEXT
);