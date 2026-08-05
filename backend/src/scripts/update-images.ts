import { v2 as cloudinary } from "cloudinary";
import { pool } from "../config/db.js";
import { env } from "../config/env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true
});

const uploads = [
  { name: "Organic Cotton Twill", file: "C:\\Users\\amtji\\.gemini\\antigravity\\brain\\ec0271d0-2381-40c6-ad9f-2b6a2e17effa\\organic_cotton_twill_1785939526446.jpg" },
  { name: "Merino Wool Flannel", file: "C:\\Users\\amtji\\.gemini\\antigravity\\brain\\ec0271d0-2381-40c6-ad9f-2b6a2e17effa\\merino_wool_flannel_1785939539352.jpg" },
  { name: "Recycled Polyester Canvas", file: "C:\\Users\\amtji\\.gemini\\antigravity\\brain\\ec0271d0-2381-40c6-ad9f-2b6a2e17effa\\recycled_polyester_canvas_1785939551767.jpg" },
  { name: "Uniform Poly-Cotton Blend", file: "C:\\Users\\amtji\\.gemini\\antigravity\\brain\\ec0271d0-2381-40c6-ad9f-2b6a2e17effa\\uniform_poly_cotton_blend_1785939563667.jpg" }
];

async function run() {
  for (const { name, file } of uploads) {
    try {
      const result = await cloudinary.uploader.upload(file, { folder: "threadmark/products" });
      const secureUrl = result.secure_url;
      await pool.query("UPDATE products SET images = ARRAY[$1] WHERE name = $2", [secureUrl, name]);
      console.log(`Updated ${name} with ${secureUrl}`);
    } catch (e) {
      console.error(`Failed to update ${name}`, e);
    }
  }
  await pool.end();
}

run();
