import sqlite3 from "sqlite3";

// create and connect to SQLite
export const db = new sqlite3.Database(":memory:");

// create a table inside
db.serialize(() => {
  db.run(
    "CREATE TABLE data (TransactionId INT, Status TEXT, Type TEXT, ClientName TEXT, Amount REAL)"
  );
});
