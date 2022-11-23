const express = require('express')
const app = express()
//
require('dotenv').config()
const port = process.env.PORT || 5000
//Middle Ware
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId  } = require('mongodb')
app.use(cors())
app.use(express.json())

//MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@firstmongodb.yjij5fj.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//JWT Token for verification
const jwt = require('jsonwebtoken')
app.post('/accesstoken', async(req, res)=> {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN)
    res.send({accessToken: token})
})
//Verify JWT token
const verifiyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: 'unauthorized access'})
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if(err){
            return res.status(403).send({message: 'unauthorized access'})
        }
        req.decoded = decoded;
        next()
    })
}

//Database connection
const dbConnect = () => {
    const treatmentsData = client.db('docPlus').collection('treatments')
    const appointmentBooking = client.db('docPlus').collection('appointments');
    //User collection
    const usersData = client.db('docPlus').collection('users');
    //Post appointments data to the mongodb
    app.post ('/appointments', async(req, res)=> {
        const newAppoint = req.body;
        const query = {
            apptDate : newAppoint.apptDate,
            treatmentName: newAppoint.treatmentName,
            email:newAppoint.email
        }
        const alreadyAppointed = await appointmentBooking.find(query).toArray()
        if(alreadyAppointed.length){
            const message = `You Already Have an appointment on ${newAppoint.apptDate} for ${newAppoint.treatmentName}`
            return res.send({ackownledged: false ,message})
        }
        const result = await appointmentBooking.insertOne(newAppoint)
        res.send(result)
    })
    

    //Get treatement options from the database
    app.get('/treatmentoptions', async(req, res)=> {
        const date = req.query.date;
        console.log(date);
        const query = {}
        const treatments = await treatmentsData.find(query).toArray()
        //Booking query and get the remaining schedule after creating new appointment
        const bookingQuery = {apptDate: date}
        const alreadyBooked = await appointmentBooking.find(bookingQuery).toArray()
        treatments.forEach(treatment=> {
            const treatmentBooked = alreadyBooked.filter(booked => booked.treatmentName === treatment.treatmentName)
            const bookedScheduled = treatmentBooked.map(booked => booked.schedule)
            const remainingSchedule = treatment.slots.filter(slot => !bookedScheduled.includes(slot))
            treatment.slots = remainingSchedule;
        })
        res.send(treatments)
    })

    //Get appointments for a specific user by email
    app.get('/appointments',verifiyJWT, async(req, res)=> {
        const email = req.query.email;
        const query = {email: email}
        const decodedEmail = req.decoded.email;
        if(email !== decodedEmail){
            return res.status(403).send({message: 'forbidden access'})
        }
        const appointments = await appointmentBooking.find(query).toArray()
        res.send(appointments)
    })
    //cancel appointment
    app.delete('/appointments/:id', async(req, res)=> {
        const id = req.params.id;
        const query = {_id: ObjectId(id)}
        const result = await appointmentBooking.deleteOne(query)
        res.send(result)

    })

    //Save users to the database
    app.post('/users', async(req, res)=> {
        const user = req.body;
        const result = await usersData.insertOne(user)
        res.send(result)
    })
    //Get users from database
    app.get('/users', verifiyJWT, async(req, res)=> {
        const query = {}
        const email = req.query.email;
        const decodedEmail = req.decoded.email;
        if(email !== decodedEmail){
            return res.status(403).send({message: 'forbidden access'})
        }
        const users = await usersData.find(query).toArray()
        res.send(users)
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