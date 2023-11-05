const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middlewre
app.use(cors({
    origin: [
        'http://localhost:5173',
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8urwnno.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// makeing meddlewares
const logger = (req, res, next) => {
    console.log('log: info', req.method, req.url);
    next();
}

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;

    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded;
        next();
    })
}

async function run() {
    try {

        const userCollection = client.db('marketDB').collection('user');
        const jobsCollection = client.db('marketDB').collection('jobs');
        const myBidsCollection = client.db('marketDB').collection('mybids');


        // job related apis
        // app.get('/jobs', async (req, res) => {
        //     const allJobs = await jobsCollection.find().toArray();
        //     res.send(allJobs);
        // })
        // app.get('/jobs/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) };
        //     const result = await jobsCollection.findOne(query);
        //     res.send(result);
        // })

        // app.get('/mybids', async (req, res) => {
        //     const cursor = myBidsCollection.find();
        //     const result = await cursor.toArray();
        //     res.send(result)
        // })

        // app.post('/mybids', async (req, res) => {
        //     const addProduct = req.body;
        //     const result = await myBidsCollection.insertOne(addProduct)
        //     res.send(result)
        // })

        // app.patch('/mybids/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: new ObjectId(id) };
        //     const updatedBooking = req.body;
        //     console.log(updatedBooking);
        //     const updateDoc = {
        //         $set: {
        //             status: updatedBooking.status,
        //         },
        //     };
        //     const result = await myBidsCollection.updateOne(filter, updateDoc)
        //     res.send(result);
        // })

        app.delete('/mybids/:id', async (req, res) => {
            const id = req.params.id;
            const quary = { _id: new ObjectId(id) };
            const result = await myBidsCollection.deleteOne(quary);
            res.send(result);
        })

        // user related apis
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            res.send(user);
        });        

        app.post('/user', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('market place server is runnig')
})

app.listen(port, () => {
    console.log(`my server is running on port ${port}`);
})