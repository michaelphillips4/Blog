import { useEffect, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import "./App.css";

type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

const STORAGE_KEY = "my-blog-posts";

function loadPosts(): Post[] {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "[]",
    );

    return Array.isArray(saved) ? (saved as Post[]) : [];
  } catch {
    return [];
  }
}

function makeExcerpt(markdown: string, maxLength = 180): string {
  const text = markdown
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[#>*_`~-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > maxLength
    ? `${text.slice(0, maxLength).trim()}…`
    : text;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(date));
}

export default function App() {
  const [posts, setPosts] = useState<Post[]>(loadPosts);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }, [posts]);

  return (
    <BrowserRouter>
      <div className="app">
        <header className="site-header">
          <Link className="brand" to="/" aria-label="Fieldnotes home">
              <h1>Richard Phillips </h1>
          </Link>

          <nav className="site-nav" aria-label="Main navigation">
                 <Link to="/admin">Manage posts</Link>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<PublicBlog posts={posts} />} />
          <Route
            path="/admin"
            element={<Admin posts={posts} setPosts={setPosts} />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>

        <footer className="site-footer">
          <span>Fieldnotes</span>
          <span>Made for ideas that stick.</span>
        </footer>
      </div>
    </BrowserRouter>
  );
}

function PublicBlog({ posts }: { posts: Post[] }) {
  const sortedPosts = [...posts].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <main className="layout public-layout">
      <section className="feed">
        <div className="intro">
                    <p className="intro-copy">
            Notes, ideas, and things worth remembering.
          </p>
        </div>

        <div className="post-list">
          {sortedPosts.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">✳</span>
              <h2>No posts yet.</h2>
              <p>New posts will appear here.</p>
            </div>
          ) : (
            sortedPosts.map((post) => (
              <article className="post-card" key={post.id}>
                <p className="post-date">{formatDate(post.createdAt)}</p>
                <h2>{post.title}</h2>
                <p className="post-excerpt">{makeExcerpt(post.content)}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function Admin({
  posts,
  setPosts,
}: {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setContent("");
  }

  function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) return;

    if (editingId) {
      setPosts((current) =>
        current.map((post) =>
          post.id === editingId
            ? { ...post, title: trimmedTitle, content: trimmedContent }
            : post,
        ),
      );
    } else {
      const newPost: Post = {
        id: crypto.randomUUID(),
        title: trimmedTitle,
        content: trimmedContent,
        createdAt: new Date().toISOString(),
      };

      setPosts((current) => [newPost, ...current]);
    }

    resetForm();
  }

  function editPost(post: Post) {
    setEditingId(post.id);
    setTitle(post.title);
    setContent(post.content);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deletePost(id: string) {
    if (!window.confirm("Delete this post?")) return;

    setPosts((current) => current.filter((post) => post.id !== id));

    if (editingId === id) resetForm();
  }

  const sortedPosts = [...posts].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <main className="layout admin-layout">
      <section className="feed">
        <div className="intro">
          <p className="eyebrow">ADMIN</p>
          <h1>Manage posts.</h1>
          <p className="intro-copy">Create, edit, or delete blog posts.</p>
        </div>

        <div className="post-list">
          {sortedPosts.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">✳</span>
              <h2>Your first post starts here.</h2>
              <p>Use the editor to create a post.</p>
            </div>
          ) : (
            sortedPosts.map((post) => (
              <article className="post-card" key={post.id}>
                <p className="post-date">{formatDate(post.createdAt)}</p>
                <h2>{post.title}</h2>
                <p className="post-excerpt">{makeExcerpt(post.content)}</p>

                <div className="post-actions">
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => editPost(post)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-button delete-button"
                    type="button"
                    onClick={() => deletePost(post.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <aside className="editor-panel">
        <div className="editor-heading">
          <div>
            <p className="eyebrow">{editingId ? "UPDATE" : "CREATE"}</p>
            <h2>{editingId ? "Edit post" : "New post"}</h2>
          </div>

          {editingId && (
            <button
              className="cancel-button"
              type="button"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={savePost}>
          <label htmlFor="post-title">Title</label>
          <input
            id="post-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Give your post a title"
            maxLength={120}
            required
          />

          <label htmlFor="post-content">Content</label>
          <textarea
            id="post-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={"Write in Markdown...\n\nTry **bold**, *italic*, or a list."}
            rows={9}
            required
          />

          <div className="markdown-hint">
            Markdown supported: **bold**, *italic*, # headings, - lists
          </div>

          <button className="save-button" type="submit">
            {editingId ? "Save changes" : "Publish post"}
          </button>
        </form>

        {content.trim() && (
          <div className="preview">
            <p className="preview-label">PREVIEW</p>
            <div className="markdown-preview">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        )}
      </aside>
    </main>
  );
}

function NotFound() {
  return (
    <main className="layout">
      <section className="feed">
        <h1>Page not found</h1>
        <Link to="/">Return to the blog</Link>
      </section>
    </main>
  );
}
