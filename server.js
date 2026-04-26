const express = require("express");
const cors = require("cors");
const postgres = require("postgres");
const app = express();
const sql = postgres(process.env.DATABASE_URL);
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
app.use(cors()); 
app.use(express.json());




//API1
app.post("/test-email", async (req, res) => {
  let username = req.body.username;
  let email = req.body.email;
  let password = req.body.password;
  let number = Math.floor(100000 + Math.random() * 900000);
  let rows = await sql`
SELECT email FROM accounts
WHERE email = ${email}
`;

if (rows.length === 1) {
  return res.json("email already exists");
} 

  try {
    await resend.emails.send({
      from: "support@konnn.com",
      to: email,
      subject: "for " + email,
      html: `<h1>verification code ${number}</h1>` 
    });

      await sql`
  INSERT INTO pending (username, email, password, code)
  VALUES (${username}, ${email}, ${password}, ${number})
  `;

    res.json("sent");


  } catch (err) {
    console.log(err);
    res.status(500).json("email doesnt exist");
  }

});





//API2 
app.post("/api2", async(req,res) => {
let username = req.body.username;
let email = req.body.email;
let password = req.body.password;
let code = req.body.code; 

let rows = await sql`
SELECT code FROM pending
WHERE email = ${email}
`;

let DBcode = rows[0].code;

if (DBcode == code) {
  await sql`
  INSERT INTO accounts (username, email, password)
  VALUES (${username}, ${email}, ${password})
  `;

  res.json("created");

}

res.status(400).json("wrong code");

});



//LOGIN API 

app.post("/loginapi", async(req,res) => {
let email = req.body.email;
let password = req.body.password;

let rows = await sql`
SELECT password FROM accounts
WHERE email = ${email}
`;

if (rows.length === 0) {
  return res.status(400).json("wrong email");
}

let DBpassword = rows[0].password

if (DBpassword == password) {
  res.json("correct");
} else {
  res.json("wrong");
}


}
)



async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      username TEXT,
      email TEXT,
      password TEXT
    )
  `;
}

initDB();

async function hatdawg() {
await sql`
CREATE TABLE IF NOT EXISTS pending (
  id SERIAL PRIMARY KEY,
  username TEXT,
  email TEXT UNIQUE,
  password TEXT NOT NULL,
  code TEXT NOT NULL
)
`;
}

hatdawg();




const PORT = process.env.PORT || 3000;

app.listen(PORT);