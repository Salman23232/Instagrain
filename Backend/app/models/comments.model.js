import mongoose from "mongoose";

const CommentsSchema = new mongoose.Schema({
    text:{type:String, required: true},
    author:{type:mongoose.Schema.Types.ObjectId, ref:'User', required: true},
    post:{type:mongoose.Schema.Types.ObjectId, ref:'Post', required: true},


})

const Comments = mongoose.model('Comments', CommentsSchema)
export default Comments