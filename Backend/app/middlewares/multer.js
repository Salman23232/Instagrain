// setting up multer middleware to upload profile picture and other files

import multer from "multer";
const Upload = multer({
  storage: multer.memoryStorage(),
});
export default Upload

//next step: we need to use this middleware on routes to before uploading any file
