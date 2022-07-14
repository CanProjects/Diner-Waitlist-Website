const express = require("express");
const app = express();
const path = require('path');
const { eventNames } = require("process");
const bcrypt = require('bcrypt');
const dotenv = require("dotenv")
const session = require('express-session');
const sanit = require('express-mongo-sanitize');
const MongoDBStore = require("connect-mongo");

const mongoose = require('mongoose');
const { time } = require("console");
dotenv.config()
const dbUrl = process.env.url
const connectionParams = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}

mongoose.connect(dbUrl, connectionParams)
    .then(() => {
        console.log('Connection to database')
    })
    .catch(err => {
        console.log('Oh no error',err)
    })


const store = new MongoDBStore({
    mongoUrl: dbUrl,
    secret: process.env.secret,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 100 },
    touchAfter: 24 * 60 * 60

})

app.use(session({
    store:store,
    secret: process.env.secret,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 100 },
    touchAfter: 24 * 60 * 60
}))


store.on("error", function(e) {
    console.log("Store error", e)
})


// This makes the scheme 
const formSchema = new mongoose.Schema({
    guests: Number,
    cname: String,
    bbq: String,
    time: String,
});

// It will make database whatever you put in quotations with an s at the end
const Form = mongoose.model('Customer', formSchema);

// These folders loaded in
app.use(express.static('css'))
app.use(express.static('js'))
app.use(express.static('img'))
const port = process.env.PORT

app.listen (port, () => {})

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname,'/views'))

//Sanitizing inputs
app.use(sanit())

// Something to do with our parsing of query data i think
app.use(express.urlencoded({extended: true}))

app.get('/', (req,res) =>{
    res.render('Main.ejs')
})

app.get('/login', (req, res) => {
    if(req.session.user_id) {
        res.redirect('/list')
    }
    else {
    res.render('login.ejs')
    }
})

app.get('/list', async(req,res) => {
    if(req.session.user_id) {
        const check = await Form.find({})
        res.render('list.ejs', { details: check })
    }
    else {
        res.redirect('/login')
    }
})

app.post('/login', async (req, res) => {
    // Finding that it is in there
    const password = req.body
    if (password.name == 'h') {
        // If you have put in your password earlier, you get this cookie which keeps 
        // you logged in.
        req.session.user_id = 'owner';
        const check = await Form.find({})
        res.render('list.ejs', { details: check })
    }
    else {
        res.render('login.ejs', {fail: 'Password Incorrect'})
    }
})


app.get('/listCustomer', async (req, res) => {
    if (req.session.user_id) {
        const check = await Form.find({})
        res.render('list.ejs', { details: check })
    }
    else {
        const check = await Form.find({})
        res.render('listCustomer.ejs', { details: check })
    }
    // Finding that it is in there

})

app.post('/list', async (req, res) => {
    // Finding that it is in there 
    const id = req.body;
    const del = await Form.deleteOne({_id:id.id})
    res.redirect('/list')
})


app.post('/queue', async (req,res) => {
    // Extracting the posted request
    const {number,name,grill} = req.body;
    // console.log(req.body)
    // Making a new form to submit based on what they sent
    const time = new Date().getTime()
    const submit = new Form ({guests: number, cname: name, bbq: grill, time: time})
    // Submitting it
    await submit.save()
    // Deleting everything
    // const del = await Form.deleteMany({})
    // console.log(del)
    // Rendering page
    res.render('confirm.ejs', {number:number, names: name, grill: grill});
})

// Catch all

app.get('*', (req,res) => {
    res.redirect('/')
})
