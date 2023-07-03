const express = require("express")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const sessions = require("client-sessions")
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set("view engine","pug")

app.use(sessions({
    cookieName: 'mySession', // cookie name dictates the key name added to the request object
    secret: 'blargadeeblargblarg', // should be a large unguessable string
    duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
    activeDuration: 1000 * 60 * 5,
    cookie: {
        ephemeral: false, // when true, cookie expires when the browser closes

    }
}));

const Schema = mongoose.Schema
const ObjectId = Schema.ObjectId
const User = mongoose.model("User", Schema({
    id: ObjectId,
    email: { type: String, unique: true },
    password: { type: String, required: true },
    firstname: String,
    lastname: String,
}))

mongoose.connect("mongodb+srv://Gowtham:B9AJwnbmJnHs107Z@cluster0.fvt73nx.mongodb.net/UserDb?retryWrites=true&w=majority")
    .then(res => console.log("Db connected"))
    .catch(err => console.log("Error connection", err))

app.get("/", (req, res) => {
    res.render("Home.pug")
})


app.get("/signup", (req, res) => {
    res.render("signup.pug")
})

app.post("/signup", (req, res) => {
    const{email,password,firstname,lastname} =req.body
    console.log(password.length);
    if(password.length < 5){
        return res.render("signup.pug", { error: "length of password is 5 characters" })
    }
     const hashpassword = bcrypt.hashSync(password, bcrypt.genSaltSync(8))
    const user = new User({
        email,
        password: hashpassword,
        firstname,
        lastname,
    })
    user.save()
        .then(dbres => {
            console.log("user is added to Db")
            res.redirect("/signin")
        })
        .catch(err => {
            if (err = 11000) {
                res.render("signup.pug", { error: "Mail id already exist try another email" })
            } else {
                res.render("signup.pug", { error: "something went wrong" })
            }
        })
})

app.get("/signin", (req, res) => {
    res.render("login.pug")
})


app.post("/signin", (req, res) => {
    const { email, password } = req.body
    User.findOne({ email })
        .then(dbres => {
            const hashpwd=bcrypt.compareSync(password,dbres.password)
            if (hashpwd) {
                req.mySession.user = dbres
                res.redirect("/profile")
            }
        })
        .catch(err => console.log("error", err))
})


app.get("/profile", (req, res) => {
    if (req.mySession && req.mySession.user) {
        User.findOne({ email: req.mySession.user.email })
            .then(function (dbres) {
                res.render("profile.pug", {
                    userdetails: dbres
                })
            })
            .catch(function (error) {
                req.GKCompany.reset();
                res.redirect("/signin");
            })
    } else {
        res.redirect("/signin")
    }
})

app.get("/logout", (req, res) => {
    req.mySession.reset()
    res.redirect("signin");
});

app.listen(2020, "localhost", (err) => {
    if (err) console.log("Error", err);
    else console.log("server is now live on localhost 2020");
})