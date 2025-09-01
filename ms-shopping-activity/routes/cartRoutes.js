import express from "express";
import cartControllers from "../controllers/cartControllers.js";

const router = express.Router();

router.post('/add_product' , cartControllers.add_product);

router.get('/:userId' , cartControllers.getCart);

router.patch('/:userId/:itemId' , cartControllers.delete_product);



export default router;