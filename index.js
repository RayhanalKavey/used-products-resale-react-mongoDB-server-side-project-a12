const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");

require("dotenv").config();
require("colors");

const app = express();
const port = process.env.PORT || 5005;

// middle ware
app.use(cors());
app.use(express.json());

// Db connections
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

// ==============
async function run() {
  try {
    // All collections starT
    //--1 User Collection
    const usersCollection = client.db("laptopUtopia").collection("users");
    //--2 Product Category Collection
    const productCategoryCollection = client
      .db("laptopUtopia")
      .collection("productCategory");
    /// All collections enD

    // console.log("connect to db");
    ///save user email and generate JWT
    // app.put("/user/email", async (req, res) => {
    //   const email = req.params.email;
    //   const user = req.body;
    //   const filter = { email: email };
    //   const options = { upsert: true };
    //   const updateDoc = {
    //     $set: user,
    //   };
    //   const result =await userCollection.updateOne(filter, updateDoc, options);
    //   console.log(result);
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN,{expiresIn:'7d'});
    // });
    // res.send({ result, token });

    // --1 Post in users collection
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
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
