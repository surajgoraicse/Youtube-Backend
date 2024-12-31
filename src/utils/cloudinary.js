import 'dotenv/config'
import { v2 as cloudinary } from "cloudinary"
import fs from "fs"


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API,
    api_secret: process.env.CLOUDINARY_SECRET
});


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

export { uploadOnCloudinary }