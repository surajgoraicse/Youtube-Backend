import { Router } from "express";
import { registerUser, loginUser, loggedOutUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware"

const router = Router()

// router.route("/register").post(registerUser)
// handle file using multer

router.route("/register").post(
    upload.fields([  // now multer can handle file upload 
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]) , registerUser
)


router.route("/login").post(loginUser)

// secured routes (user authorization)

router.route("/logout").post(verifyJWT , loggedOutUser)





export default router;