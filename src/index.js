import 'dotenv/config'
import mongoose from "mongoose"
import { DB_NAME } from './constants.js';
import connectDB from "./db/index.js"


/*
// Method 1: of connecting db......

import express from "express"
const app = express()
(async () => {
    try {
      const response = await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("Express Error : ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log("app is listening at port ", process.env.PORT);
        })

    } catch (error) {
        console.log("ERROR : " , error);
        throw error
    }
 })()
 */

// Method 2: of connecting db(professional)



connectDB();