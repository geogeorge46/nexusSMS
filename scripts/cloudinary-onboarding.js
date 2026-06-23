#!/usr/bin/env node

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dcfjy2j5b",
  api_key: "181255534237518",
  api_secret: "Sqt7fBbtv9eHawSA4O1BVb5e_W0",
  secure: true,
});

const sampleImageUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";

async function main() {
  const uploadResult = await cloudinary.uploader.upload(sampleImageUrl, {
    folder: "nexus-sms/onboarding",
    overwrite: true,
  });

  console.log("Uploaded image secure URL:", uploadResult.secure_url);
  console.log("Uploaded image public ID:", uploadResult.public_id);

  const imageDetails = await cloudinary.api.resource(uploadResult.public_id);

  console.log("Image width:", imageDetails.width);
  console.log("Image height:", imageDetails.height);
  console.log("Image format:", imageDetails.format);
  console.log("Image file size in bytes:", imageDetails.bytes);

  const transformedUrl = cloudinary.url(uploadResult.public_id, {
    secure: true,
    // f_auto asks Cloudinary to choose the best image format for the browser.
    fetch_format: "auto",
    // q_auto asks Cloudinary to balance visual quality and file size automatically.
    quality: "auto",
  });

  console.log(
    "Done! Click link below to see optimized version of the image. Check the size and the format.",
  );
  console.log(transformedUrl);
}

main().catch((error) => {
  console.error("Cloudinary onboarding failed:");
  console.error(error);
  process.exitCode = 1;
});
