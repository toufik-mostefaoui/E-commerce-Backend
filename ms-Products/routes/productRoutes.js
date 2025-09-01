import express from 'express';
import productController from '../controllers/productController.js';

const router = express.Router();

router.post('/product' , productController.add_product);

router.patch('/product/:id' , productController.update_product );

router.patch('/product/:id/:quantity_required' , productController.update_product_quantity);

router.delete('/product/:id' , productController.delete_product);

router.get('/products' , productController.get_products);

router.get('/product/:id' , productController.get_product_by_id);

router.get('/product-by-type/:type' , productController.get_product_by_type);



export default router;