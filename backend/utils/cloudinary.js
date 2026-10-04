import { v2 as cloudinary } from "cloudinary";

const isConfigured = () =>
    Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );

if (isConfigured()) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

/**
 * Upload a local file (from multer disk storage) to Cloudinary.
 * Returns the secure URL, or null when Cloudinary isn't configured.
 */
export const uploadToCloudinary = async (filePath, folder = "medmate/avatars") => {
    if (!isConfigured()) return null;
    const res = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: "image",
        transformation: [{ width: 256, height: 256, crop: "fill", gravity: "face" }],
    });
    return res.secure_url;
};

export default uploadToCloudinary;
