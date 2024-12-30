import mongoose, { Schema, model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    discription: {
        type: String,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    views: {
        type: Number,
        required: true
    },
    isPublished: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

videoSchema.plugin(mongooseAggregatePaginate)


export const Video = model("Video", videoSchema)