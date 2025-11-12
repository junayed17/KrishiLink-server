const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
require("dotenv").config();
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.vdcsgkx.mongodb.net/?appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

// database connection 
const database=client.db("KrisiLink");
const collection=database.collection("allPosts");




// api for post add 

app.post("/addPost",async(req,res)=>{
  const data=req.body;
  const result=await collection.insertOne(data)
  res.send(result)
})



// api for all data 
app.get("/allPosts",async(req,res)=>{
  const result = await collection.find().toArray();
  res.send(result)
})


// api for latest Post 

app.get("/latestPosts", async (req, res) => {
  const result = await collection.find().limit(3).toArray();
  res.send(result);
});



// api for all the post 

app.get("/allPosts", async (req, res) => {
  const result = await collection.find().toArray();
  res.send(result);
});




// api to get my post only
app.get("/myPosts", async (req, res) => {
 const email= req.query.email
 const query = {
   "owner.ownerEmail": email,
 };

 console.log(email);
 
  const result = await collection.find(query).toArray();
  res.send(result);
});







    app.get("/", (req, res) => {
      res.send("hey i am trying to connect database");
    });

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
