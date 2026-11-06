import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function openLocalDatabase(
  filename = resolve(".folio-data/pages.sqlite"),
) {
  if (filename !== ":memory:")
    mkdirSync(resolve(filename, ".."), { recursive: true });
  const sqlite = new DatabaseSync(filename);
  sqlite.exec("PRAGMA journal_mode = WAL");
  if (
    !sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'published_pages'",
      )
      .get()
  ) {
    sqlite.exec(
      readFileSync(
        new URL("../drizzle/0000_published_pages.sql", import.meta.url),
        "utf8",
      ),
    );
  }
  return {
    close: () => sqlite.close(),
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      const bound = (values) => ({
        first: async () => statement.get(...values) || null,
        run: async () => ({
          meta: { changes: Number(statement.run(...values).changes) },
        }),
        bind: (...next) => bound(next),
      });
      return bound([]);
    },
  };
}
