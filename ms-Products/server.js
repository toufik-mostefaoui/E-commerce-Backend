import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

import './eurekaClient.js';

const app = express();

app.use(bodyParser.json());
app.use(cookieParser());
app.use("/api", routes);

app.get("/info", (req, res) => res.send("OK"));

const db_name = process.env.MONGOURL;
mongoose.connect("mongodb://localhost:27017/ms-product");
const db = mongoose.connection;
db.once("open", async () => {
  console.log("Connected to MongoDB");
});

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`listen on port ${port}`);
});
