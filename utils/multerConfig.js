import path from 'path';
import multer from 'multer';

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(path.resolve(), 'public', 'storage')); 
  },
  filename: function(req, file, cb) {
    const userId = req.session.user.User_ID; 
    const fileExtension = path.extname(file.originalname);  
    const fileName = `${userId}_${Date.now()}${fileExtension}`;  
    cb(null, fileName);
  }
});

const upload = multer({ storage: storage });

export { upload };
