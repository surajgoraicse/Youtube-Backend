import { Router } from "express";
import { registerUser, loginUser, loggedOutUser, refreshAccessToken, changeCurrentPassword, updateAccountDetais, getCurrentUser, updateAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

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
    ]), registerUser
)


router.route("/login").post(loginUser)

// secured routes (user authorization)

router.route("/logout").post(verifyJWT, loggedOutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetais)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile) // getting data from url TODO: test using param

router.route("/history").get(verifyJWT, getWatchHistory)




export default router;