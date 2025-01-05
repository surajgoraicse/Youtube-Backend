import { asyncHandler } from "../utils/AsyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary, removeFromCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

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

    // getting data from the body
    const { username, email, password } = req.body

    // validating data
    console.log("username and email:", username, "   ", email);
    if (!username && !email) {   // TODO: && operator
        throw new ApiError(400, "username or email is required")
    }

    // check if user exists
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "user does not exist")  // TODO: use an else block
    }


    // password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, " Invalid user credentials")  // TODO: use an else block
    }


    // generating access and refresh tokens
    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id)


    // getting the user data obj
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
        }, "User logged In successfully"))


})

const loggedOutUser = asyncHandler(async (req, res) => {
    // added a middleware to the express app that adds user details to the req object

    //  remove the refresh token from db
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true  // will return the updated user
        }
    )

    const options = {  // making cookies secure
        httpOnly: true,// can be changed only by browsers
        secure: true
    }


    console.log("logout successfully");
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.body.refreshToken
    // const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        console.log("decoded token : ", decodedToken);

        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError("Invalid request token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Referesh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Success"))

    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    /*  
    get data from body
    validate data
    compare password in db
    update the password
    send response
    */
    console.log("command in the change password");
    const { currentPassword, newPassword } = req.body
    // TODO: perform validation

    const user = await User.findById(req.user._id)
    // compare password

    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid current password")
    }

    user.password = newPassword  // it will hash automatically as we have injected a middleware on save event
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, {}, "password changed successfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
    console.log(user);
    return res.status(200).json(200, user, "current user fetched successfully")
})

const updateAccountDetais = asyncHandler(async (req, res) => {
    /*
     get date from the user
     validate data
     update the data
     */

    const { fullName, email } = req.body
    if (!fullName && !email) {
        throw new ApiError(400, "all field are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullName,
            email,
        }
    }, { new: true }).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))

})

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    // console.log(avatar.url);
    if (!avatar.url) {
        throw new ApiError(500, "Error uploading to cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, { new: false }).select("-password -refreshToken")
    // console.log(user);

    const removeAvatar = await  removeFromCloudinary(user.avatar)
    // console.log("remove avatar response : ", removeAvatar);

    const updatedUser = await User.findById(req.user?._id)

    return res.status(200).json(200, updatedUser, "avatar changed successfully")
})


const updateCoverImage = asyncHandler(async (req, res) => {
    /*
    get data from the body
    validate data
    validate the user
    update the converImage
    remove the converImage from cloudinary TODO: utility to remove old image
    */
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "converImage file is missing")
    }

    const converImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!converImage.url) {
        throw new ApiError(500, "Error uploading to cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            converImage: converImage.url
        }
    }, { new: true }).select("-password -refreshToken")

    return res
        .status(200)
        .json(200, user, "converImage changed successfully")
})


const getUserChannelProfile = asyncHandler(async (req, res) => {
    /* 
    Aggregation pipelines TODO:
    steps:
    get username from params

    */
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions", // db schema
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }

    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist")
    }

    return res.status(200).json(new ApiResponse(200, channel[0], "user channel fetched successfully"))


})


const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
                /*
                
                MongoDB _id vs. Mongoose-generated _id: MongoDB generates an _id of type ObjectId by default. Mongoose uses the same ObjectId type for _id unless explicitly overridden.

                Aggregation Pipelines: When using aggregation pipelines directly in MongoDB or via Mongoose, the pipeline operates on the raw database documents. If your pipeline involves filtering, grouping, or matching using _id, it must be of type ObjectId. If the _id you're dealing with is a string (e.g., passed from the client), you'll need to convert it explicitly to ObjectId using Mongoose or the native MongoDB driver.

                Implicit Conversion by Mongoose: For operations like find or findById, Mongoose implicitly converts string _id values to ObjectId behind the scenes, simplifying the process. However, aggregation pipelines do not leverage Mongoose's implicit conversion because they are closer to raw MongoDB operations.

                In summary, when working with aggregation pipelines, ensure you explicitly convert string _id values to ObjectId if they are passed in as strings. For other Mongoose-based operations, this conversion is typically handled for you.
                
                */
            }
        },
        {
            $lookup: {
                from: "videos", // lowercase and plural
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                },
                                {
                                    $addFields: {
                                        owner: {
                                            $first: "$owner"
                                        }
                                    }
                                }

                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"))
})

export {
    registerUser,
    loginUser,
    loggedOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetais,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}