import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

// configure express app

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true,
}))

// configuring payload request
app.use(express.json({
    limit: "16kb",
}))
app.use(express.urlencoded({
    extends: true, limit: "16kb"
}))
app.use(express.static("public"))


app.use(cookieParser())



// routes import 

import userRouter from "./routes/user.routes.js"



// routes declaration
app.use("/api/v1/users", userRouter)
// what happens here is : whenever this link,http://localhost:8000/api/v1/users is triggered, the control is passed to userRouter which is a middleware in this case
// http://localhost:8000/api/v1/users/register
// here middleware is used to define route because we defining routes using router
// not using app.get("/route" , ()=>{data})

export { app }