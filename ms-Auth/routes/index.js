import express from 'express';
const router = express.Router();
import userRoutes from './userRoutes.js'
router.use('/' , userRoutes);

export default router;
