const express = require("express");
const cors = require("cors");
const postgres = require("postgres");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const sql = postgres(process.env.DATABASE_URL);
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
app.use(cors({
  origin: [
 "https://www.konnn.com",
 "https://konnn.com"
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());












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
      from: "power@konnn.com",
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
SELECT username, password FROM accounts
WHERE email = ${email}
`;

if (rows.length === 0) {
  return res.status(400).json("wrong email");
}

let DBpassword = rows[0].password;
let DBusername = rows[0].username;

if (DBpassword == password) {
 const token = jwt.sign(
      { email: email },
      "secretkey",
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000
});

      return res.json({
      status: "correct",
     
    });
} else {
 return res.json({
    status: "wrong"
});
}
});

//AUTO LOGIN
app.get("/autologin", async(req,res) => {
let token = req.cookies.token;

if(!token) {
  return res.json("failed")
}

try {
let data = jwt.verify(token, "secretkey")
return res.json("success")
} catch {
  return res.json("failed")
}
})


//clearcookies
app.get("/logout", async(req,res) => {
  res.clearCookie("token", {
  httpOnly: true,
  secure: true,
  sameSite: "none"
});

res.json("logged out");
})














//ui API
app.post("/ui", async(req,res) => {
    const token = req.cookies.token;

  try {
  let decoded = jwt.verify(token, "secretkey"); 
  let email = decoded.email;

  let rows = await sql`
  SELECT username FROM accounts
  WHERE email = ${email}
  `;

  let username = rows[0].username;
  res.json({
    username: username
  })
  } catch {
    res.json({
      username: "fails"
    })
  }


})
























//add

app.post("/add", async(req, res) => {
let token = req.cookies.token;
let REmail = req.body.REmail;

let decoded = jwt.verify(token, "secretkey");
let email = decoded.email;

let senderusn = await sql`
SELECT username 
FROM accounts
WHERE email = ${email}
`;

let username = senderusn[0].username;

let rows = await sql`
SELECT email FROM  accounts
WHERE email = ${REmail}
`;

if (rows.length === 0) {
 return res.json("the email doesnt exists")
}


let rowss = await sql`
SELECT pendingfriends FROM accounts
WHERE email = ${REmail}
`;

let data = rowss[0].pendingfriends;

data++;

await sql`
INSERT INTO pendingpwends (sender, receiver, username, number)
VALUES (${email}, ${REmail}, ${username}, ${data})

`;

await sql`
UPDATE accounts
SET pendingfriends = ${data}
WHERE email = ${REmail}
`;


res.json("sent");





})




//request API
app.post("/request", async(req,res) => {
const token = req.cookies.token;

let decoded = jwt.verify(token, "secretkey");
let email = decoded.email;

let senders = await sql`
SELECT sender, number, username
FROM pendingpwends
WHERE receiver = ${email}
ORDER BY number DESC
`;

  if (senders.length === 0) {
    return res.json("no pending requests");
  }


res.json({
data: senders
})



})


app.get("/accept", async(req, res) => {
  let token = req.cookies.token;
  let email = req.query.acceptemail;

  let decoded = jwt.verify(token, "secretkey");
  let receiveremail = decoded.email;

  await sql`
  DELETE FROM pendingpwends
  WHERE sender = ${email} AND receiver = ${receiveremail}
  `;
})

















async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      username TEXT,
      email TEXT,
      friends INTEGER DEFAULT 0,
      pendingfriends INTEGER DEFAULT 0,
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


async function pendingpwends() {
  await sql`
  CREATE TABLE IF NOT EXISTS pendingpwends (
  sender TEXT,
  receiver TEXT,
  username TEXT,
  number INTEGER DEFAULT 0
  )
  `;
}

pendingpwends();




const PORT = process.env.PORT || 3000;

app.listen(PORT);