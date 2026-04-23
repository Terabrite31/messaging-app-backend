const express = require("express");
const cors = require("cors");
const postgres = require("postgres");
const app = express();
const sql = postgres(process.env.DATABASE_URL);

async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      email TEXT,
      password TEXT
    )
  `;
}

initDB();
app.use(cors()); 
app.use(express.json());

let messages = "chickentest2";

// GET messages
app.get("/messages", (req, res) => {
    res.json(messages);
});






let textstore = "";


app.post("/send", (req, res) => {
    const { text } = req.body;
    textstore = text;
    res.json({textstore });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT);