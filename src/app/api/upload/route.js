import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [name, ...rest] = c.trim().split("=");
      return [name, decodeURIComponent(rest.join("="))];
    })
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  const cookieHeader = req.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const token = cookies.token;

  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convert Blob to base64 data URI
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64String}`;

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(dataUri, {
      folder: "avatars",
      public_id: `avatar-${Date.now()}`, // unique
      overwrite: true,
    });

    return new Response(
      JSON.stringify({ url: uploadResponse.secure_url }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return new Response(
      JSON.stringify({ error: "Upload failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
