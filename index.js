const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    // All collections starT------------------------
    //--1 User Collection
    const usersCollection = client.db("laptopUtopia").collection("users");

    //--2 Product Category Collection
    const productCategoryCollection = client
      .db("laptopUtopia")
      .collection("productCategory");

    //--3 Booking collection
    const bookingCollection = client.db("laptopUtopia").collection("bookings");
    // All collections enD

    // console.log("connect to db");
    ///save user email (--1 put in users collection) and generate JWT token------------------------
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      console.log(result);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "7d",
      });
      res.send({ result, token });
    });

    //get admin --1 fetch this admin data using custom hook in the client site
    app.get(`/users/admin/:email`, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
      // console.log({ isAdmin: user?.role === "admin" });
    });
    //get buyer --1 fetch this  buyer data using custom hook in the client site workinG
    app.get(`/users/buyer/:email`, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isBuyer: user?.accountType === "Buyer Account" });
      // console.log({ isBuyer: user?.accountType === "Buyer Account" });
    });
    //get seller --1 fetch this  seller data using custom hook in the client site workinG
    app.get(`/users/seller/:email`, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.accountType === "Seller Account" });
      console.log({ isSeller: user?.accountType === "Seller Account" });
    });

    /// --2 get product category from the database --------------------------------
    app.get(`/productCategory`, async (req, res) => {
      const query = {};
      const options = await productCategoryCollection.find(query).toArray();
      res.send(options);
    });
    // --2 get product  data for an individual category

    app.get(`/productCategory/:id`, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const options = await productCategoryCollection.findOne(query);
      res.send(options);
    });
    /// --3 post booking collection -------------------------------
    app.post("/bookings", async (req, res) => {
      const user = req.body;
      const result = await bookingCollection.insertOne(user);
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
