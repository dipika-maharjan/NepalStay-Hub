import multer, { FileFilterCallback } from "multer";
import path from "path";
import crypto from "crypto";
import { Request } from "express";
import fs from "fs";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const createStorage = (folder: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const destination = path.join(__dirname, "../../uploads", folder);
      fs.mkdirSync(destination, { recursive: true });
      cb(null, destination);
    },
    filename: (_req, file, cb) => {
      const randomName = crypto.randomBytes(16).toString("hex");
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${randomName}${ext}`);
    },
  });

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG and WebP images are allowed"));
  }
};

const baseUpload = multer({
  storage: createStorage("misc"),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const verificationUpload = multer({
  storage: createStorage("verification"),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const accommodationUpload = multer({
  storage: createStorage("accommodations"),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const profileUpload = multer({
  storage: createStorage("profiles"),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const uploads = {
  single: (fieldName: string) => baseUpload.single(fieldName),
  array: (fieldName: string, maxCount: number) => baseUpload.array(fieldName, maxCount),
  fields: (fieldsArray: { name: string; maxCount?: number }[]) => baseUpload.fields(fieldsArray),
};