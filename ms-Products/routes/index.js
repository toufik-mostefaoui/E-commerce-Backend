import express from "express";
import productRoutes from '../routes/productRoutes.js';

const router = express.Router();

router.use('/' , productRoutes);

export default router;