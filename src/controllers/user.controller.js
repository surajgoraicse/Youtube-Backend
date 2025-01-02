import { asyncHandler } from "../utils/AsyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import fs from 'fs'

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        // whenever a value is updated in the user model, the properties with required filed gets activated. So to pass this, mongoose provide a property to skip validation

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

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
    // console.log(avatarLocalPath);

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

const loginUser = asyncHandler(async (req, res) => {
    // get data from body
    // validata username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie
    // send response

    const { username, email, password } = req.body
    if (!username || !email) {   // TODO: && operator
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "user does not exist")  // TODO: use an else block
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new ApiError(401, " Invalid user credentials")  // TODO: use an else block
    }


    // generating access and refresh tokens
    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    // select method is used here to remove the password and refreshToken properties from the user object.

    const options = {  // making cookies secure
        httpOnly: true,// can be changed only by browsers
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {
            user: loggedInUser,
            accessToken,
            refreshToken
        }, "User logged In successfully" ))


})

const loggedOutUser = asyncHandle(aync(req, res) => {

    
    User
})


export { registerUser, loginUser , loggedOutUser }