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
        'https://job-hub-mine.netlify.app/'
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
        const myPostedJobsCollection = client.db('marketDB').collection('mypostedjobs');


        // token api
        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            console.log('user for token', user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
                .send({ success: true });
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);
            res.clearCookie('token', { maxAge: 0 }).send({ success: true });
        })

        // job related apis
        app.get('/jobs', async (req, res) => {
            const allJobs = await jobsCollection.find().toArray();
            res.send(allJobs);
        })

        app.get('/jobs/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobsCollection.findOne(query);
            res.send(result);
        })

        app.get('/mypostedjobs', verifyToken, async (req, res) => {
            const cursor = myPostedJobsCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/mypostedjobs/:id', async (req, res) => {
            const id = req.params.id;
            const quary = { _id: new ObjectId(id) };
            const result = await myPostedJobsCollection.findOne(quary);
            res.send(result);
        })

        app.post('/mypostedjobs', async (req, res) => {
            const addJob = req.body;
            const result = await myPostedJobsCollection.insertOne(addJob)
            res.send(result)
        })

        app.put('/mypostedjobs/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedJob = req.body;
            const job = {
                $set: {
                    email: updatedJob.email,
                    jobtitle: updatedJob.jobtitle,
                    deadline: updatedJob.deadline,
                    description: updatedJob.description,
                    miniprice: updatedJob.miniprice,
                    maxprice: updatedJob.maxprice,
                    category: updatedJob.category
                }
            }
            const result = await myPostedJobsCollection.updateOne(filter, job, options)
            res.send(result);
        })

        app.delete('/mypostedjobs/:id', async (req, res) => {
            const id = req.params.id;
            const quary = { _id: new ObjectId(id) };
            const result = await myPostedJobsCollection.deleteOne(quary);
            res.send(result);
        })

        // my bids rlated api

        app.get('/mybids',verifyToken, async (req, res) => {
            const customStatusOrder = ['pending','in progress', 'complete', 'reject'];
            const cursor = myBidsCollection.find({
                status: { $in: customStatusOrder },
            }).sort({ status: 1 });
            const result = await cursor.toArray();
            res.send(result);
        });


        app.get('/mybids/:id', async (req, res) => {
            const id = req.params.id;
            const quary = { _id: new ObjectId(id) };
            const result = await myBidsCollection.findOne(quary);
            res.send(result);
        })

        app.post('/mybids', async (req, res) => {
            const addProduct = req.body;
            const result = await myBidsCollection.insertOne(addProduct)
            res.send(result)
        })

        app.patch('/mybids/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedBid = req.body;
            // console.log(updatedBooking);
            const updateDoc = {
                $set: {
                    status: updatedBid.status,
                },
            };
            const result = await myBidsCollection.updateOne(filter, updateDoc)
            res.send(result);
        })

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