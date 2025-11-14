const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
require("dotenv").config();
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const database = client.db("KrisiLink");
    const collection = database.collection("allPosts");

    // api for post add

    app.post("/addPost", async (req, res) => {
      const data = req.body;
      const result = await collection.insertOne(data);
      res.send(result);
    });

    // api for all data
    app.get("/allPosts", async (req, res) => {
      const result = await collection.find().toArray();
      res.send(result);
    });

    // api for latest Post

    app.get("/latestPosts", async (req, res) => {
      const result = await collection.find().limit(6).toArray();
      res.send(result);
    });

    // api for all the post

    app.get("/allPosts", async (req, res) => {
      const result = await collection.find().toArray();
      res.send(result);
    });

    // api to get my post only
    app.get("/myPosts", async (req, res) => {
      const email = req.query.email;
      const query = {
        "owner.ownerEmail": email,
      };

      const result = await collection.find(query).toArray();
      res.send(result);
    });

    // details of a post api
    app.get("/postDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };

      console.log(id);

      const result = await collection.findOne(query);
      res.send(result);
    });

    // get my interests Posts

    app.get("/myInterestedPosts/:email", async (req, res) => {
      try {
        const email = req.params.email;

        const query = {
          interests: {
            $elemMatch: { email: email },
          },
        };

        const result = await collection.find(query).toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
      }
    });

    // delete my post api
    app.delete("/myPost/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await collection.deleteOne(query);
      res.send(result);
    });

    // order api

    app.patch("/post/:id", async (req, res) => {
      try {
        const postId = req.params.id;

        const updatedData = req.body;

        updatedData._id = new ObjectId();

        const result = await collection.updateOne(
          { _id: new ObjectId(postId) },
          {
            $push: {
              interests: updatedData,
            },
          }
        );

        res.send(result);
      } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
      }
    });

    // update my post api

    app.patch("/myPost/:id", async (req, res) => {
      const id = req.params.id;
      const updatededData = req.body;
      const updatedDoc = {
        $set: updatededData,
      };
      const query = {
        _id: new ObjectId(id),
      };

      const result = await collection.updateOne(query, updatedDoc);
      res.send(result);
    });

    // update status  of my post interests of others api
app.patch("/interestStatus/:postId/:interestId", async (req, res) => {
  const { postId, interestId } = req.params;
  const { status } = req.body;

  try {
    const result = await collection.updateOne(
      {
        _id: new ObjectId(postId),
        "interests._id": new ObjectId(interestId),
      },
      {
        $set: { "interests.$.status": status },
      }
    );

    res.send(result);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
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
