import multer from "multer";
const messageList = {
  400: "Bad Request",
  403: "Forbidden",
  404: "Not Found",
};

export const HttpError = (status, message = messageList[status]) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const ALLOWED_AVATAR_EXTENSION = "csv";

const storage = multer.memoryStorage();
const fileFilter = function (req, file, cb) {
  const extension = file.originalname.split(".").pop();

  if (ALLOWED_AVATAR_EXTENSION !== extension) {
    return cb(
      HttpError(
        400,
        `${extension} is not a valid format. Please upload a ${ALLOWED_AVATAR_EXTENSION} file.`
      )
    );
  }

  cb(null, true);
};

export const upload = multer({ storage, fileFilter });
