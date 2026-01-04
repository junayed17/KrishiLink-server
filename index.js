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
    const usersCollection = database.collection("usersCollection");

    // api for post add

    app.post("/addPost", async (req, res) => {
      const data = req.body;
      const result = await collection.insertOne(data);
      res.send(result);
    });

    // api for all data
    app.get("/allPosts", async (req, res) => {
      const { catagory, sort, limit, pageIndex } = req.query;
      const searchItem = {
        
      };
      if (catagory) {
        searchItem.type=catagory
      }
      const sortt = {};
      if (sort) {
        sortt.pricePerUnit = sort;
      }
      let limititem=0;
      if (limit) {
        limititem = Number(limit);
      }
      let skip=0;
      if (pageIndex) {
        skip = Number(pageIndex) * limititem;
      }
      

      
      
      const result = await collection.find(searchItem).sort(sortt).skip(skip).limit(limititem).toArray();
      res.send(result);
    });

    // api for latest Post

    app.get("/latestPosts", async (req, res) => {
      const result = await collection
        .find({})
        .sort({ _id: -1 })
        .limit(8)
        .toArray();
      res.send(result);
    });








    app.post("/users", async (req, res) => {
      const user = req.body;

      // 1. Prothome check koro ei email-er user age theke database-e ache kina
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        // 2. Jodi age thekei thake, tobe r add korbe na
        return res.send({ message: "User already exists", insertedId: null });
      }

      // 3. Jodi user notun hoy, tobei insert korbe
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });


    // finding overview api 
   app.get("/site-stats", async (req, res) => {
     try {
       // 1. Total Posts count
       const totalPosts = await collection.countDocuments();

       // 2. Total Sellers (Using Aggregation for API Version 1 compatibility)
       const sellerStats = await collection
         .aggregate([
           {
             $group: {
               _id: "$owner.ownerEmail", // Protita unique email ke group korbe
             },
           },
           {
             $count: "totalSellers", // Group hoye jaoa email gulo ke count korbe
           },
         ])
         .toArray();

       const totalSellers =
         sellerStats.length > 0 ? sellerStats[0].totalSellers : 0;

       // 3. Stock Out Posts count (quantity "0" hole)
       const totalusers= await usersCollection.countDocuments();

       res.send({
         totalPosts,
         totalSellers,
         totalusers,
       });
     } catch (error) {
       console.error("Error fetching stats:", error);
       res.status(500).send({ message: "Internal Server Error" });
     }
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






// dashboard data finder api 

app.get("/owner-stats", async (req, res) => {
  const email = req.query.email;
console.log(email);

  // ১. Oi owner-er shob post khunje ber koro
  const posts = await collection
    .find({ "owner.ownerEmail": email })
    .toArray();

  // ২. Variables initialize koro
  let totalInterests = 0;
  let vegetable = 0;
  let fruit = 0;
  let grain = 0;
  let others = 0;

  // ৩. Loop chaliye shob calculate koro
  posts.forEach((crop) => {
    // Interest count koro (jodi interests array thake)
    totalInterests += crop.interests ? crop.interests.length : 0;

    // Type onujayi count koro
    if (crop.type === "Vegetable") vegetable++;
    else if (crop.type === "Fruit") fruit++;
    else if (crop.type === "Grain") grain++;
    else others++;
  });

  // ৪. Response pathao
  res.send({
    totalPosts: posts.length,
    totalInterests,
    vegetable,
    fruit,
    grain,
    others,
  });
});




// post vs interests api 

app.get("/interest-stats/:email", async (req, res) => {
  const email = req.params.email;

  

  // ১. Oi owner-er shob post khunje ber koro
  const posts = await collection.find({ "owner.ownerEmail": email }).toArray();

  // ২. Protita post theke name ebong total requested quantity ber koro
  const result = posts.map((post) => {
    // interest array theke quantity gulo jog koro
    const totalRequested = post.interests
      ? post.interests.reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0
        )
      : 0;

    return {
      name: post.name,
      requested: totalRequested,
      stock: Number(post.quantity),
    };
  });

  res.send(result);
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
