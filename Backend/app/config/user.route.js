//creating the routers for the controllers
import express from "express";
import { editProfile, followOrUnfollow, getProfile, getSuggestion, login, logout, register } from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

// need the router method from express
const router = express.Router()

// getting route form the router

router.route('/register').post(register)
router.route('/login').post(login)
router.route('/logout').get(logout)
router.route('/:id/profile').get(authMiddleware,getProfile)
router.route('/profile/edit').post(authMiddleware,editProfile)
router.route('/suggested').get(authMiddleware, getSuggestion)
router.route('/follow/:id').get(authMiddleware, followOrUnfollow)

export default router
//next step: we need to attach it in th app.js




