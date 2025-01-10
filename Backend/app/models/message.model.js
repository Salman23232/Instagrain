import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    senderId:{type:mongoose.Schema.Types.ObjectId, ref:'User'},
    receiverId:{type:mongoose.Schema.Types.ObjectId, ref:'User'},
    message:{type:String, required: true}
})

const Message = mongoose.model('Message', MessageSchema)
export default Message