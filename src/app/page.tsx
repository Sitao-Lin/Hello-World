import { connection } from "next/server";
import { getBooks, type Book } from "@/lib/books";
import styles from "./page.module.css";

export default async function Home() {
  await connection();
  let books: Book[] = [];
  let failed = false;
  try {
    books = await getBooks();
  } catch {
    failed = true;
    console.error("Book list unavailable. Check Supabase configuration, table, and read policy.");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>THE READING ROOM</p>
        <h1>A little shelf of<br />great stories.</h1>
        <p className={styles.subtitle}>Discover a book. Find your next adventure.</p>
      </header>
      <section aria-labelledby="books-heading">
        <div className={styles.sectionHeading}>
          <h2 id="books-heading">The collection</h2>
          {!failed && <span>{books.length} {books.length === 1 ? "book" : "books"}</span>}
        </div>
        {failed ? (
          <p role="alert" className={styles.notice}>The collection is unavailable right now. Please try again shortly.</p>
        ) : books.length === 0 ? (
          <p className={styles.notice}>The shelf is empty. Check back soon for new books.</p>
        ) : (
          <ul className={styles.grid}>
            {books.map((book, index) => (
              <li key={book.id} className={styles.card}>
                <span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h3>{book.title}</h3>
                <p className={styles.author}>by {book.author}</p>
                <p className={styles.description}>{book.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <footer className={styles.footer}>Hello World · The Reading Room</footer>
    </main>
  );
}
