import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(path.resolve(), "public", "storage"));
  },
  filename: (req, file, cb) => {
    const userId = req.session.user.User_ID;
    const fileExtension = path.extname(file.originalname); // Get file extension
    const fileName = `${userId}_${Date.now()}${fileExtension}`;
    cb(null, fileName); // Save file with this unique name
  },
});

const upload = multer({ storage: storage });

const insuranceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(path.resolve(), "public", "storage", "insurance"));
  },
  filename: function (req, file, cb) {
    const userId = req.session.user.User_ID;
    const fileExtension = path.extname(file.originalname);
    const fileName = `${userId}_${Date.now()}${fileExtension}`;
    cb(null, fileName);
  },
});
const uploadInsurance = multer({ storage: insuranceStorage });

export { upload, uploadInsurance };
