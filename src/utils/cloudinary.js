import 'dotenv/config'
import { v2 as cloudinary } from "cloudinary"
import fs from "fs"


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API,
    api_secret: process.env.CLOUDINARY_SECRET
});

const removeFromCloudinary = async (url) => {
    try {
        if (!url) {
            throw new ApiError(400, "Invalid cloudinary url")
        }
        const public_id = url.slice(url.lastIndexOf('/') + 1, url.lastIndexOf('.')).trim()
        const res = await cloudinary.uploader.destroy(public_id)
        console.log("file removed successfully ", res);
        return res;
    } catch (error) {
        throw new ApiError(500, "Error uploading to cloudinary : ", error)
        return null
    }
}

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {  // file path is not provided , so returning null or you may also return an error
            return null
        }
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // file has been uploaded successfully
        // console.log("file is uploaded on cloudinary", response.url); // TODO: remove the local file
        fs.unlinkSync(localFilePath) // remove the locally saved temporary as the upload operation got failed
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary as the upload operation got failed
        return null
    }
}

export { uploadOnCloudinary ,removeFromCloudinary }