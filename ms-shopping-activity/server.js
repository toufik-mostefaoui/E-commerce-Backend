import bodyParser from 'body-parser';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import routes from './routes/index.js'

import './eurekaClient.js';

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use("/api" , routes);


const db_name = process.env.MONGO_URL;
mongoose.connect(db_name);
const db = mongoose.connection;
db.once("open", async () => {
  console.log("Connected to MongoDB");
});



const port = process.env.PORT ;

app.listen(port , () => {
    console.log(`listen on port ${port}`);    
});
