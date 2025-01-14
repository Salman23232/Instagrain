import User from "../models/user.model.js";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import getDataUri from "../utility/dataUri.js";
import cloudinary from "../utility/cloudinary.js";

//creating the register function to let the user register
export const register = async (req, res) => {
  try {
    //getting the username, email, password from the form body
    const { username, email, password } = req.body;

    //make sure the user puts their information properly and anything is not missing
    if (!username || !email || !password) {
      return res.status(401).json({
        success: false,
        message: "these fields are required",
      });
    }
    //make sure the information is unique and the user don't exists before
    const user = await User.findOne({ email });
    if (user) {
        return res.status(401).json({
            success: false,
            message: "User already registered",
          });
    }
    // creating the hashed password
    const hashedPassword = await bcrypt.hash(password, 10)
    //if all conditions are checked, finally we will create the user
    await User.create({
        username,
        email,
        password: hashedPassword
    })
    // if everything is perfect then return success
    return res.status(200).json({
        success: true,
        message: "Account created successfully"
    })
  } catch (error) {
    console.log(error);
  }
};

//creating the login function to let the user login
export const login = async (req, res) => {
    try {
      //getting the email, password from the form body
      const {email, password } = req.body;
  
      //make sure the user puts their information properly and anything is not missing
      if (!email || !password) {
        return res.status(401).json({
          success: false,
          message: "these fields are required",
        });
      }
      //make sure the user exists
      let user = await User.findOne({ email });
      if (!user) {
          return res.status(401).json({
              success: false,
              message: "Incorrect email or password",
            });
      }
      // check if the password is matched
      const isPasswordMatched = await bcrypt.compare(password, user.password)
      if (!isPasswordMatched) {
        return res.status(401).json({
            success: false,
            message: "Incorrect email or password",
          });
      }
      // also returning the logged in user as response
      const {_id, username, profilePicture, bio, followers, following, posts} = user
      user = {
        _id,
        username,
        email: user.email,
        profilePicture,
        bio,
        followers,
        following,
        posts
      }
      // if password is matched then we need to generate a token for the user for login
      const token = await jwt.sign({userId:user._id},process.env.SECRET_KEY,{expiresIn: '1d'})
      // when login is done we will return a cookie using the token we generated and return success
      return res.cookie('token',token,{httpOnly:true, sameSite:'strict',maxAge: 1*60*60*24*1000}).json({
          success: true,
          message: `Welcome back ${user.username}`,
          user
      })
    } catch (error) {
      console.log(error);
    }
  };

//creating the logout function to let the user logout
export const logout = async (_, res) => {
    try {
      return res.cookie('token', '',{maxAge:0}).json({
          success: true,
          message: "Logged out successfully",
          
      })
    } catch (error) {
      console.log(error);
    }
  };

//creating the getProfile function to get the users profile
export const getProfile = async (req, res) => {
    try {
        //First we need to get the user id. 
        const userId = req.params.id
        //Using the user id we can get the profile of the user
        const profile = await User.findById(userId)

        //After that all we need to do is to return the profile as a response
      return res.status(200).json({
          success: true,
          profile         
      })
    } catch (error) {
      console.log(error);
    }
  };

//creating the editProfile function to edit the profile of the user

export const editProfile = async (req, res) => {
    try {
     // To edit the profile we need to do some authentication so that user can only edit their own profile and when they are logged in. To do that we need to make a middleware
     const userId = req.id
     // getting bio and gender from req.body
     const {bio, gender} = req.body
     // getting the profile picture from req.file
     const profilePicture = req.file
     let cloudResponse;
     if (profilePicture) {
    // we need to setup dataUri in order to upload any image on cloudinary. to upload any image we use dataUri
    const fileUri = getDataUri()
    // then we need to upload the data uri to the cloudinary on the cloudResponse variable
     cloudResponse = await cloudinary.uploader.upload(fileUri)
     }
     //we need to find the user first in order to update the profile
     const user = User.findById(userId)
     //we need to check if the bio is available if yes only then we will change it
     if (bio) {
        user.bio = bio
     }
     //we need to check if the bio is available if yes only then we will change it
     if (gender) {
        user.gender = gender
     }
     //we need to check if the bio is available if yes only then we will change it
     if (profilePicture) {
        user.profilePicture = cloudResponse.secure_url
     }

     await user.save()
      return res.status(200).json({
          success: true,
          message: 'Profile updated',
          user         
      })
    } catch (error) {
      console.log(error);
    }
  };


// create getSuggestion function for getting the suggestion for the user 
export const getSuggestion = async (req, res) => {
    try {
    // to suggest other users we need to get all the users except the user who is logged in
    const suggestedUsers = await User.find({_id:{$ne:req.id}}).select("-password")
    // check if the platform currently have any users or not
    if (!suggestedUsers) {
        return res.status(400).json({
            success: false,
            message: "Don't have any users at",
          });
    }
    // when required checks are checked, we will return succuss
    return res.status(200).json({
        success: true,
        suggestedUsers       
    })
    } catch (error) {
      console.log(error);
    }
  };

export const followOrUnfollow = async (req, res) => {
    try {
        // we need to find the user id who will follow. req.id is to get the user id who is logged in. and req.params.id is used to get the id as a params from url
        const whoWillFollow = req.id // Me
        // also we need to find who is being followed by the logged in user
        const whoWillBeFollowed = req.params.id //Suppose: Ronaldo

        // Restrict the the user to follow himself
        if (whoWillBeFollowed === whoWillFollow) {
            return res.status(401).json({
                success: false,
                message: 'You cannot follow yourself',
            })
        }
        // we need to find the whole user
        const loggedInUser = await User.findById(whoWillFollow)
        const targetedUser = await User.findById(whoWillBeFollowed)
        if (!loggedInUser || !targetedUser) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            })
        }
        // now we will check what we gonna do, follow or unfollow?
        const isFollowing = loggedInUser.following.includes(whoWillBeFollowed)

        //check if the user is already followed. if yes than remove it and if no than add it. promise.all is used to perform 2 operation once
        if (isFollowing) {
            //Unfollow logic
            await Promise.all([
                User.updateOne({_id: whoWillFollow},{$pull: {following: whoWillBeFollowed}}),
                User.updateOne({_id: whoWillBeFollowed},{$pull: {followers: whoWillFollow}})
            ])
            return res.status(200).json({
                success: true,
                message: "Unfollowed successfully"
            })
        } else{
            //Follow logic
            await Promise.all([
                User.updateOne({_id: whoWillFollow},{$push: {following: whoWillBeFollowed}}),
                User.updateOne({_id: whoWillBeFollowed},{$push: {followers: whoWillFollow}})
            ])
            return res.status(200).json({
                success: true,
                message: "followed successfully"
            })
        }


    } catch (error) {
      console.log(error);
    }
  };



