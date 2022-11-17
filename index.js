const express = require('express')
const app = express()
//
require('dotenv').config()
const port = process.env.PORT || 5000
//Middle Ware
const cors = require('cors')
const { MongoClient, ServerApiVersion  } = require('mongodb')
app.use(cors())
app.use(express.json())

//MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@firstmongodb.yjij5fj.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//Database connection
const dbConnect = () => {
    const appointmentsData = client.db('docPlus').collection('appointments');

    //Post appointments data to the mongodb
    app.post ('/appointments', async(req, res)=> {
        const newAppoint = req.body;
        const result = await appointmentsData.insertOne(newAppoint)
        res.send(result)
    })
}

dbConnect()

//Default port
app.get('/', (req,res)=> {
    res.send('Server running')
})

//app listener
app.listen(port, ()=> {
    console.log('Server Running on Port: ', port);
})