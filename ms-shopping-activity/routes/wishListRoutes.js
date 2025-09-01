import express from "express";
import wishListControllers from "../controllers/wishListControllers.js";

const router = express.Router();

router.post('/add_product' , wishListControllers.add_product);

router.get('/:userId' , wishListControllers.getWishlist);

router.patch('/:userId/:productId' , wishListControllers.delete_product);

router.post('/exists' , wishListControllers.existsInWishlist);



export default router;