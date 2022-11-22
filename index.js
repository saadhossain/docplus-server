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
    const treatmentsData = client.db('docPlus').collection('treatments')
    const appointmentBooking = client.db('docPlus').collection('appointments');
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