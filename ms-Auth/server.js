import express from "express";
import bodyParser from "body-parser";
import routes from "./routes/index.js";
import cookieParser from 'cookie-parser';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import './eurekaClient.js';



import dotenv from "dotenv";
dotenv.config();


const app = express();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(bodyParser.json());
app.use(cookieParser()); 
app.use("/api", routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`listen on port ${PORT}`);
});
