const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
// laptop-utopia-server.vercel.app

// https:
require("dotenv").config();
require("colors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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

// =========================================== verify jwt function
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  //if token not given notE security layer --1
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access!" });
  }
  const token = authHeader.split(" ")[1];
  //if token not valid notE security layer --2 //if expired token then you get this return by using this status logged out the uer
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access!" });
    }
    req.decoded = decoded;
    next();
  });
}

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

    // --4 product collection
    const productCollection = client.db("laptopUtopia").collection("products");
    // --5 product collection
    const paymentCollection = client.db("laptopUtopia").collection("payments");
    // --6 Reported items
    const reportedCollection = client.db("laptopUtopia").collection("reports");
    // All collections enD
    //=========================================
    //verify admin///notE: Make sure you run verify admin after verifyJWT
    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "admin") {
        console.log("this user is not an  admin");
        return res.status(403).send({ message: "Forbidden access" });
      }
      next();
    };
    //=========================================

    // --6 . post to reported collection
    app.post("/reports", async (req, res) => {
      const reportedProduct = req.body;
      const result = await reportedCollection.insertOne(reportedProduct);
      res.send(result);
    });

    // //--6 deleting report
    app.delete("/reports/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await reportedCollection.deleteOne(filter);
      res.send(result);
    });
    /// --6 get reported products
    app.get(`/reports`, async (req, res) => {
      const query = {};
      const options = await reportedCollection.find(query).toArray();
      res.send(options);
    });

    // --4 get product collection
    app.get(`/products/:name`, async (req, res) => {
      const sellerName = req.params.name;
      const query = { sellerName };
      const options = await productCollection.find(query).toArray();
      res.send(options);
    });

    // console.log("connect to db");
    ///save user email (--1 put in users collection) and generate JWT token
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
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "4h",
      });
      res.send({ result, token });
    });

    //get admin --1 get api for only buyer data
    app.get(`/users/buyer`, verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      const query = { accountType: "Buyer Account" };
      const options = await usersCollection.find(query).toArray();
      res.send(options);
    });
    //get admin --1 get api for only seller data
    app.get(`/users/seller`, verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      const query = { accountType: "Seller Account" };
      const options = await usersCollection.find(query).toArray();
      res.send(options);
    });
    //get admin --1 fetch this admin data using custom hook in the client site
    app.get(`/users/admin/:email`, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });
    //get buyer --1 fetch this  buyer data using custom hook in the client site----------
    app.get(`/users/buyer/:email`, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({
        isBuyer:
          user?.accountType !== "Seller Account" && user?.role !== "admin",
      });
    });
    //get seller --1 fetch this  seller data using custom hook in the client site
    app.get(`/users/seller/:email`, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.accountType === "Seller Account" });
    });

    // --1 verify a seller----------------------

    app.put(`/users/seller/:id`, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = { $set: { verifySeller: "verified" } };
      const result = await usersCollection.updateOne(
        query,
        updatedDoc,
        options
      );
      res.send(result);
    });

    // //--1 deleting buyers/sellers
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
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

    /// --3 get Booking collection
    app.get(`/bookings`, verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      ///if the verified token's email is the logged in users email notE security layer --3
      if (email !== decodedEmail) {
        return res.status(403).send({ message: "Forbidden Access!" });
      }
      const query = { email: email };
      const options = await bookingCollection.find(query).toArray();
      res.send(options);
    });

    // --3 post booking collection -
    app.post("/bookings", async (req, res) => {
      const bookProduct = req.body;
      const result = await bookingCollection.insertOne(bookProduct);
      res.send(result);
    });

    //--3 Get data from booking collection for payment
    app.get(`/bookings/:id`, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const options = await bookingCollection.findOne(query);
      res.send(options);
    });

    /// --4 get product from  product collection with category name for product component to show the product details to the product details page
    app.get(`/products`, async (req, res) => {
      let query = {};

      const options = await productCollection.find(query).toArray();
      res.send(options);
    });
    // to find sellers product

    // --4 post product for adding new product
    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
    });
    // // //--4 deleting products
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    // --4 add advertised role to the product
    app.put("/products/advertised/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = { $set: { advertisementStatus: "advertised" } };
      const result = await productCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    /// --5 CREATE PAYMENT INTENT--------------
    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    // --5
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);
      const id = payment.bookingId;
      const idForFindingProduct = payment?.bookedProductId;
      const query = { _id: ObjectId(id) };
      const filter = { _id: ObjectId(idForFindingProduct) };
      const updatedDoc = {
        $set: {
          paymentStatus: "paid",
          transactionId: payment.transactionId,
        },
      };
      const updateBookingCollection = await bookingCollection.updateOne(
        query,
        updatedDoc
      );
      const updateProductCollection = await productCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });

    // //Temporary to update soldStatus  field on appointment collection (update many)--1
    // app.get("/addSoldStatus", async (req, res) => {
    //   const filter = {};
    //   const updatedDoc = { $set: { soldStatus: "Available" } };
    //   const options = { upsert: true };
    //   const result = await productCollection.updateMany(
    //     filter,
    //     updatedDoc,
    //     options
    //   );
    //   res.send(result);
    // });
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
