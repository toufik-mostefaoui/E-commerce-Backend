import express from "express";
import cartRoutes from '../routes/cartRoutes.js';
import wishListRoutes from '../routes/wishListRoutes.js'

const router = express.Router();

router.use('/cart' , cartRoutes);

router.use('/wishList' , wishListRoutes);

export default router;