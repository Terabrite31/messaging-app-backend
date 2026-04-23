const express = require("express");
const cors = require("cors");
const postgres = require("postgres");
const app = express();
const sql = postgres(process.env.DATABASE_URL);
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
app.use(cors()); 
app.use(express.json());

app.post("/test-email", async (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  try {
    await resend.emails.send({
      from: "noreply@konnn.com",
      to: email,
      subject: "for " + email,
      html: "<h1>Congrats! you are officially the golden gays</h1>"
    });

    res.json("sent");
  } catch (err) {
    console.log(err);
    res.status(500).json("error");
  }
});



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




const PORT = process.env.PORT || 3000;

app.listen(PORT);