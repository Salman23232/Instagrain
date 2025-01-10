import express, { urlencoded } from "express";
import cors from 'cors'
import jwt from 'jsonwebtoken'
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import ConnectMongoDB from "./app/utility/mongodbConnect.js";
dotenv.config({})

// creating/initializing the express app
const app = express()
const port = process.env.PORT || 3000

//application middlewares
app.use(express.json())
app.use(cookieParser())
app.use(urlencoded({extended: true}))
const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true
} // connect react with express
app.use(cors(corsOptions))



app.get('/', function (req, res) {
    res.send('hello')
})

app.listen(port, function () {
    ConnectMongoDB()
    console.log("the server is running at "+port);
    
})