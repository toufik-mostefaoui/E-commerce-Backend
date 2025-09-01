import express from 'express';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();
import userController, { verifyToken } from '../controllers/userController.js';

router.get("/users",userController.get_users);

router.post("/register", userController.register);

router.post('/login'  ,userController.login);

router.get('/user/profile' , verifyToken , userController.profile);

router.post('/refresh-token' , userController.token_refresh);

router.delete('/logout', userController.logout)

router.post("/auth/google", express.json(), userController.handleGoogleAuth);

router.post('/auth/facebook', express.json(), userController.handleFacebookAuth);

router.post('/upload', verifyToken, upload.single('avatar'),userController.uploadProfileImage);


export default router;