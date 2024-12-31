import { asyncHandler } from "../utils/AsyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import fs from 'fs'


const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation : not empty
    // check if user already exists : with username and email
    // check for images , check for avatar(required)
    // upload them to cloudinary, avatar 
    // (check if user has passed an image or not, if the image is passed then check if it is uploaded in our server or not and then ulitmately check if is successfully uploaded in the cloudinary or not)
    // create user object => create entry in db
    // remove password and refresh token field from response
    // check if use is created or not
    // then send response

    const { username, email, fullName, password } = req.body

    // we can validate seperately but it will not be efficient in terms of quality
    // if (fullName === "") {
    //     throw new ApiError(400 , "fullName is required")
    // }  

    // validating

    if ([username, email, fullName, password].some((field) => (
        field?.trim() === ""
    ))) {
        throw new ApiError(400, "All field are required")
        // console.log("all field are required");
    }


    // checking if the user already exists in db
    // const existedUser = User.findOne({ email }) // returns true if email exists

    const existedUser = await User.findOne({  // returns true if email or username exists
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with username or email already exists")
    }



    // check for images
    // req.files comes from multer (not a part of express)
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    // Upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // check if it is uploaded or not
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // upload on db

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // check if user is created or not . if the user is created then remove the password and refreh token field from it.
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    // select method will remove the properties passed into it. by default it takes all so we need to define only those tath we don't want

    if (!createdUser) {
        throw new ApiError(500, "error registering the user")
    }
    // send response

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )


})


export { registerUser }