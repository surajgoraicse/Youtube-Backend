import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"

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




export default router;