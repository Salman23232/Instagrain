//connect mongodb with mongoose
import mongoose from "mongoose"

const ConnectMongoDB = async () => {
    try {
       await mongoose.connect(process.env.MONGODB_URI)   
       console.log('connected mongodb successfully');
    } catch (error) {
        console.log(error);
        
    }
}
export default ConnectMongoDB