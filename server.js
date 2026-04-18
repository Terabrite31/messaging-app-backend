const express = require("express");
const app = express();

app.use(express.json());

let messages = [];

// GET messages
app.get("/messages", (req, res) => {
  res.json(messages);
});

// POST message
app.post("/send", (req, res) => {
  const { text } = req.body;
  messages.push(text);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});