import sharp from "sharp";
import cloudinary from "../utility/cloudinary.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Comments from "../models/comments.model.js";

export const addNewPost = async (req, res) => {
  try {
    //first we need to get the caption from the form body
    const { caption } = req.body;
    //second we need to get the image from the form file
    const authorId = req.id;
    // third we need image
    const image = req.file;

    //if theres a problem uploaded image
    if (!image) {
      return res
        .status(400)
        .json({ success: false, message: "image is required" });
    }
    // to optimize the quality of the image we will need to setup sharp package
    const optimizedImageBuffer = await sharp(image.buffer)
      .resize({ width: 800, height: 800, fit: "inside" })
      .toFormat("jpeg", { quality: 80 })
      .toBuffer();

    // next we need to convert the buffer file to dataUri
    const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString(
      "base64"
    )}`;
    const cloudResponse = await cloudinary.uploader.upload(fileUri);
    const post = await Post.create({
      caption,
      image: cloudResponse.secure_url,
      author: authorId,
    });
    // Now next what we need to do is to add posts in the post array of the users model whenever any new post is added
    const user = await User.findById(authorId);
    if (user) {
      // if the user exists we will push the id of the new post created on the array of the posts
      user.posts.push(post._id);
      await user.save();
    }
    // getting the author details from id from the new post create. by populating it we are getting the whole data of the author with just the id
    await post.populate({ path: "author", select: "-password" });

    return res.status(200).json({
      success: true,
      message: "New post added",
    });
  } catch (error) {
    console.log(error);
  }
};
export const allPost = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 }) // this is use to sort the post from bottom to top
      .populate({ path: "author", select: "username, profilePicture" }) // this is used to get the profile picture and username of the author who posted that post
      .populate({
        path: "comments", // now we will populate the comments from the post model
        sort: { createdAt: -1 }, // we will sort it
        populate: { path: author, select: "username, profilePicture" }, // we will populate the comments again to get the author who had commented on the post
      });
    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    console.log(error);
  }
};

export const userPost = async (req, res) => {
  try {
    const authorId = req.id; // getting the id
    const userPosts = await Post.find({ author: authorId })
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username, profilePicture" }) // this is used to get the profile picture and username of the author who posted that post
      .populate({
        path: "comments", // now we will populate the comments from the post model
        sort: { createdAt: -1 }, // we will sort it
        populate: { path: author, select: "username, profilePicture" }, // we will populate the comments again to get the author who had commented on the post
      });
    return res.status(200).json({
      success: true,
      userPosts,
    });
  } catch (error) {}
};

export const like = async (req, res) => {
  try {
    const userWhoWillLike = req.id;
    const postId = req.params.id;
    const likedPost = await Post.findById(postId);
    if (!likedPost) {
      return res.status(404).json({ message: "post not found", success: true });
    }

    // like logic started. addtoset is used to add a unique value on the array. Otherwise it will not add any value
    await likedPost.updateOne({ $addToSet: { likes: userWhoWillLike } }); // the logic is we got the post which was liked and we will update the likes array of that post. we will add the liked user id to that array
    await likedPost.save(); //when ever we deal with anything related updateOne, we must use save.

    // implementing socket.io for real time interaction

    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
  }
};
export const dislike = async (req, res) => {
  try {
    const userWhoWillLike = req.id;
    const postId = req.params.id;
    const likedPost = await Post.findById(postId);
    if (!likedPost) {
      return res.status(404).json({ message: "post not found", success: true });
    }

    // like logic started. addtoset is used to add a unique value on the array. Otherwise it will not add any value
    await likedPost.updateOne({ $pull: { likes: userWhoWillLike } }); // the logic is we got the post which was liked and we will update the likes array of that post. we will remove the liked user id to that array
    await likedPost.save(); //when ever we deal with anything related updateOne, we must use save.

    // implementing socket.io for real time interaction

    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
  }
};

export const addComment = async (req, res) => {
  try {
    const userWhoWillComment = req.id;
    const postId = req.params.id;
    const { text } = req.body;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found", success: true });
    }
    if (!text) {
      return res
        .status(404)
        .json({ message: "Text is required", success: true });
    }
    const comment = await Comment.create({
      text,
      author: userWhoWillComment,
      post: postId,
    }).populate({ path: "author", select: "username, profilePicture" });

    post.comments.push(comment._id)
    await post.save()

    return res.status(200).json({ success: true, comment});
  } catch (error) {
    console.log(error);
  }
};
export const getCommentsOfPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const comments  = await Comments.find({post:postId}).populate({path: 'author', select:'username, profilePicture'})
    if (!comments) {
      return res.status(404).json({ message: "No comments found for this post", success: true });
    }
    return res.status(200).json({ success: true, comments});
  } catch (error) {
    console.log(error);
  }
};

export const deletePost = async (req, res) => {
  try {
    const authorId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found", success: true });
    }
    if (post.author.toString() !== authorId) {
      return res
        .status(404)
        .json({ message: "Unauthorized", success: false });
    }
    // delete logic
    await Post.findByIdAndDelete(postId)

    // now remove the user id from the users post
    let user = await User.findById(authorId)
    user.posts = user.posts.filter(id => id.toString() !== postId)
    await user.save();

    //also delete comments associated with the post
    await Comments.deleteMany({post: postId})

    return res.status(200).json({ success: true, message:'Post deleted successfully'});
  } catch (error) {
    console.log(error);
  }
};

export const bookMarkPost = async (req, res) => {
  try {
    const authorId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found", success: true });
    }
    const user = await User.findById(authorId)
    if (user.bookmarks.includes(post._id)) {
      
    }

    return res.status(200).json({ success: true, message:'Post deleted successfully'});
  } catch (error) {
    console.log(error);
  }
};
