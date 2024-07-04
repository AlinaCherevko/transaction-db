import sqlite3 from "sqlite3";

// create and connect to SQLite
export const db = new sqlite3.Database(":memory:");

// create a table inside
db.serialize(() => {
  db.run(
    "CREATE TABLE data (TransactionId INT, Status TEXT, Type TEXT, ClientName TEXT, Amount REAL)"
  );

  db.run(
    "CREATE TABLE users ( Id INTEGER PRIMARY KEY AUTOINCREMENT, Username TEXT NOT NULL UNIQUE, Password TEXT NOT NULL, Email TEXT NOT NULL UNIQUE, Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
  );
});
