import mongoose, { Schema, SchemaType } from "mongoose";

const subscriptionSchema = Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // one who is subscribing 
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // one who is 'subscriber' is subscribing 
        ref: "User"
    }
}, { timestamps: true })

export const Subscription = mongoose.model("Subscription", subscriptionSchema)

// subscribers will get channels
// channel will get subscribers