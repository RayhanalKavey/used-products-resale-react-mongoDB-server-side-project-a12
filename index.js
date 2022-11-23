const express = require("express");
const cors = require("cors");

require("dotenv").config();
require("colors");

const app = express();
const port = process.env.PORT || 5005;

// middle ware
app.use(cors());
app.use(express.json());

// Db connections
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hufticd.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
// client.connect((err) => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });
///===================================
async function run() {
  try {
  } finally {
  }
}
run().catch(console.dir);
///===================================

app.get("/", (req, res) => {
  res.send("Welcome to Laptop Utopia");
});
app.listen(port, () => {
  console.log(`Laptop Utopia server is running on port: ${port}`);
});
