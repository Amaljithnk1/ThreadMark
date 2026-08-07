import {v2 as cloudinary} from "cloudinary";import {CloudinaryStorage} from "multer-storage-cloudinary";import {env} from "../config/env.js";
const configured=Boolean(env.CLOUDINARY_CLOUD_NAME&&env.CLOUDINARY_API_KEY&&env.CLOUDINARY_API_SECRET);if(configured)cloudinary.config({cloud_name:env.CLOUDINARY_CLOUD_NAME,api_key:env.CLOUDINARY_API_KEY,api_secret:env.CLOUDINARY_API_SECRET,secure:true});
export function assertCloudinary(){if(!configured)throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.")}
export const productImageStorage=new CloudinaryStorage({cloudinary,params:async()=>({folder:"threadmark/products",resource_type:"image",allowed_formats:["jpg","jpeg","png","webp"]})});
export const verificationDocumentStorage=new CloudinaryStorage({cloudinary,params:async()=>({folder:"threadmark/verification-documents",resource_type:"raw"})});
