import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import stream from "stream";
import csvParser from "csv-parser";
import { db } from "./database.js";
import { HttpError, upload } from "./middlewares/upload.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// getting data from csv file and set all transactions
app.post("/upload", upload.single("csvfile"), (req, res, next) => {
  if (!req.file) {
    return next(HttpError(400, "No file uploaded."));
  }
  // csv file handling
  const csvData = req.file.buffer.toString("utf8");
  const results = [];

  // create instance csv-parser
  const parser = csvParser();

  // Connecting CSV data to the parser stream
  const csvStream = new stream.PassThrough();
  csvStream.end(csvData);
  csvStream
    .pipe(parser)
    .on("data", (data) => results.push(data))
    .on("end", () => {
      const stmt = db.prepare(
        "INSERT INTO data (TransactionId, Status, Type, ClientName, Amount) VALUES (?, ?, ?, ?, ?)"
      );
      results.forEach((row) => {
        stmt.run(
          row.TransactionId,
          row.Status,
          row.Type,
          row.ClientName,
          row.Amount,
          (err) => {
            if (err) {
              return next(HttpError(500, err.message));
            }
          }
        );
      });
      stmt.finalize();
      res.status(200).send("Data uploaded successfully.");
    })
    .on("error", (err) => {
      next(HttpError(500, "Error parsing CSV data."));
    });
});

// get all transactions
app.get("/transactions", (req, res, next) => {
  db.all("SELECT * FROM data", [], (err, rows) => {
    if (err) {
      return next(HttpError(500, "Error retrieving data"));
    }
    res.json(rows);
  });
});

// get one transaction by id
app.get("/transactions/:id", (req, res, next) => {
  const { id } = req.params;
  db.get("SELECT * FROM data WHERE TransactionId = ?", [id], (err, row) => {
    if (err) {
      return next(HttpError(500, "Error retrieving data"));
    }
    if (!row) {
      return next(HttpError(404, "Transaction not found"));
    }
    res.json(row);
  });
});

// delete one transaction by id
app.delete("/transactions/:id", (req, res, next) => {
  const { id } = req.params;
  db.run("DELETE FROM data WHERE TransactionId = ?", [id], function (err) {
    if (err) {
      return next(HttpError(500, "Error deleting data"));
    }
    if (this.changes === 0) {
      return next(HttpError(404, "Transaction not found"));
    }
    res.status(200).send("Transaction was deleted successfully");
  });
});

// update transaction by id
app.patch("/transactions/:id/status", (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  const query = `UPDATE data SET Status = ? WHERE TransactionId = ?`;
  db.run(query, [status, id], function (err) {
    if (err) {
      return next(HttpError(500, "Error updating status"));
    }
    res.status(200).send("Status was updated successfully.");
  });
});

// Handle non-existing routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  const { status = 500, message = "Server error" } = err;
  res.status(status).json({ message });
});

app.listen(3000, () => {
  console.log("Server running on port 3000!");
});
