
import "dotenv/config";

import { Request, Response } from "express";
import Thumbnail from "../models/Thumbnail.js";

import fs from "fs";
import axios from "axios";

import { v2 as cloudinary } from "cloudinary";


// ============================================
// CLOUDINARY CONFIG
// ============================================

cloudinary.config({
  secure: true,
});

console.log("Cloudinary config:", {
  cloud_name: cloudinary.config().cloud_name,
  api_key: cloudinary.config().api_key
    ? "SET"
    : "MISSING",
  api_secret: cloudinary.config().api_secret
    ? "SET"
    : "MISSING",
});


// ============================================
// POLLINATIONS API KEY
// ============================================

// Your .env:
//
// STABILITY_API_KEY=sk_xxxxxxxxx

const pollinationsApiKey =
  process.env.STABILITY_API_KEY;

if (!pollinationsApiKey) {
  throw new Error(
    "STABILITY_API_KEY is missing from .env"
  );
}

console.log(
  "Pollinations API Key: LOADED"
);

console.log(
  "Pollinations API Key Prefix:",
  pollinationsApiKey.substring(0, 3)
);


// ============================================
// STYLE PROMPTS
// ============================================

const stylePrompts = {
  "Bold & Graphic":
    "eye-catching YouTube thumbnail, vibrant colors, expressive facial reaction, dramatic lighting, high contrast, click-worthy composition, professional YouTube thumbnail style",

  "Tech/Futuristic":
    "futuristic YouTube thumbnail, sleek modern design, digital UI elements, glowing accents, holographic effects, cyber-tech aesthetic, sharp lighting, high-tech atmosphere",

  Minimalist:
    "minimalist YouTube thumbnail, clean layout, simple shapes, limited color palette, plenty of negative space, modern flat design, clear focal point",

  Photorealistic:
    "photorealistic YouTube thumbnail, ultra-realistic lighting, natural skin tones, candid moment, DSLR-style photography, lifestyle realism, shallow depth of field",

  Illustrated:
    "illustrated YouTube thumbnail, custom digital illustration, stylized characters, bold outlines, vibrant colors, creative cartoon or vector art style",
};


// ============================================
// COLOR SCHEME DESCRIPTIONS
// ============================================

const colorSchemeDescriptions = {
  vibrant:
    "bright vibrant colors, high saturation, energetic and colorful appearance",

  sunset:
    "warm orange, pink and purple hues, soft golden light",

  forest:
    "deep green, earthy tones, natural and refreshing atmosphere",

  neon:
    "bright neon colors, glowing accents, cyberpunk aesthetic",

  purple:
    "deep purple, violet and magenta tones, premium modern appearance",

  monochrome:
    "black and white color scheme, high contrast, clean and dramatic look",

  ocean:
    "deep blue, teal and turquoise tones, cool and refreshing atmosphere",

  pastel:
    "soft pastel colors, low saturation, gentle and elegant appearance",
};


// ============================================
// GENERATE THUMBNAIL
// ============================================

export const generateThumbnail = async (
  req: Request,
  res: Response
) => {

  let filePath: string | null = null;

  try {

    // ========================================
    // GET LOGGED-IN USER
    // ========================================

    const { userId } = req.session;

    if (!userId) {
      return res.status(401).json({
        message:
          "Unauthorized. Please login first.",
      });
    }


    // ========================================
    // GET REQUEST BODY
    // ========================================

    const {
      title,
      prompt: user_prompt,
      style,
      aspect_ratio,
      color_scheme,
      text_overlay,
      text_overlay_text,
    } = req.body;


    // ========================================
    // VALIDATE TITLE
    // ========================================

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Title is required",
      });
    }


    // ========================================
    // CREATE THUMBNAIL RECORD
    // ========================================

    const thumbnail =
      await Thumbnail.create({

        userId,

        title,

        prompt_used:
          user_prompt,

        user_prompt,

        style,

        aspect_ratio,

        color_scheme,

        text_overlay,

        text_overlay_text,

        isGenerating: true,

      });


    // ========================================
    // SELECT STYLE
    // ========================================

    const selectedStyle =
      stylePrompts[
        style as keyof typeof stylePrompts
      ] ||
      stylePrompts["Bold & Graphic"];


    // ========================================
    // BUILD AI PROMPT
    // ========================================

    let prompt = `
Create a professional, highly engaging YouTube thumbnail.

Main topic:
"${title}"

Visual style:
${selectedStyle}

The thumbnail should look like a professionally designed YouTube thumbnail.

Use a strong focal point.
Use excellent visual hierarchy.
Use high contrast.
Use professional composition.
Make the subject immediately understandable.
Avoid unnecessary clutter.
`;


    // ========================================
    // COLOR SCHEME
    // ========================================

    if (color_scheme) {

      const selectedColor =
        colorSchemeDescriptions[
          color_scheme as keyof typeof colorSchemeDescriptions
        ];

      if (selectedColor) {

        prompt += `

Color scheme:
${selectedColor}
`;

      }

    }


    // ========================================
    // USER CUSTOM PROMPT
    // ========================================

    if (
      user_prompt &&
      user_prompt.trim()
    ) {

      prompt += `

Additional requirements:
${user_prompt}
`;

    }


    // ========================================
    // TEXT OVERLAY
    // ========================================

    if (
      text_overlay &&
      text_overlay_text
    ) {

      prompt += `

TEXT REQUIREMENT:

Include the following exact English text prominently in the thumbnail:

"${text_overlay_text}"

IMPORTANT:

- Use English only.
- Do not translate the text.
- Do not paraphrase the text.
- Do not change the text.
- Do not replace any word.
- Spell every word exactly as provided.
- Do not create random letters.
- Do not create fake words.
- Do not use another language.
- Use clear and readable typography.
- Make the text large enough to read.
- Make the text visually attractive.
- Keep the text highly visible.
`;

    }


    // ========================================
    // FINAL PROMPT
    // ========================================

    prompt += `

Final requirements:

Create a high-quality YouTube thumbnail.

Make the subject immediately understandable.

Use professional visual hierarchy.

Use strong contrast.

Use an attractive composition.

Aspect ratio:
${aspect_ratio || "16:9"}
`;


    console.log(
      "========================================"
    );

    console.log(
      "Generating thumbnail with Pollinations AI..."
    );

    console.log(
      "Model: flux"
    );

    console.log(
      "Prompt:",
      prompt
    );

    console.log(
      "========================================"
    );


    // ========================================
    // IMAGE DIMENSIONS
    // ========================================

    let width = 1280;
    let height = 720;

    if (aspect_ratio === "1:1") {

      width = 1024;
      height = 1024;

    } else if (aspect_ratio === "4:5") {

      width = 1024;
      height = 1280;

    } else if (aspect_ratio === "9:16") {

      width = 720;
      height = 1280;

    } else if (aspect_ratio === "4:3") {

      width = 1024;
      height = 768;

    } else {

      width = 1280;
      height = 720;

    }


    // ========================================
    // ENCODE PROMPT
    // ========================================

    const encodedPrompt =
      encodeURIComponent(prompt);


    // ========================================
    // POLLINATIONS IMAGE URL
    // ========================================

    const generatedImageUrl =
      `https://gen.pollinations.ai/image/${encodedPrompt}` +
      `?model=flux` +
      `&width=${width}` +
      `&height=${height}` +
      `&nologo=true`;


    console.log(
      "Pollinations URL created"
    );

    console.log(
      "Waiting for Pollinations image..."
    );


    // ========================================
    // DOWNLOAD IMAGE FROM POLLINATIONS
    // ========================================

    const imageResponse =
      await axios.get(
        generatedImageUrl,
        {

          headers: {
            Authorization:
              `Bearer ${pollinationsApiKey}`,
          },

          responseType:
            "arraybuffer",

          timeout:
            300000,

          maxContentLength:
            Infinity,

          maxBodyLength:
            Infinity,

        }
      );


    // ========================================
    // CONVERT TO BUFFER
    // ========================================

    const finalBuffer =
      Buffer.from(
        imageResponse.data
      );


    if (
      !finalBuffer ||
      finalBuffer.length === 0
    ) {

      throw new Error(
        "Pollinations returned an empty image"
      );

    }


    console.log(
      "Image generated successfully by Pollinations"
    );

    console.log(
      "Image size:",
      finalBuffer.length,
      "bytes"
    );


    // ========================================
    // SAVE IMAGE TEMPORARILY
    // ========================================

    fs.mkdirSync(
      "images",
      {
        recursive: true,
      }
    );


    filePath =
      `images/thumbnail-${Date.now()}.png`;


    fs.writeFileSync(
      filePath,
      finalBuffer
    );


    console.log(
      "Temporary image saved:",
      filePath
    );


    // ========================================
    // UPLOAD TO CLOUDINARY
    // ========================================

    console.log(
      "========================================"
    );

    console.log(
      "Uploading image to Cloudinary..."
    );

    console.log(
      "File path:",
      filePath
    );


    const uploadResult =
      await cloudinary.uploader.upload(
        filePath,
        {
          resource_type: "image",
          timeout: 120000,
        }
      );


    console.log(
      "Cloudinary upload successful"
    );

    console.log(
      "Cloudinary URL:",
      uploadResult.secure_url
    );

    console.log(
      "========================================"
    );


    // ========================================
    // UPDATE MONGODB
    // ========================================

    thumbnail.image_url =
      uploadResult.secure_url;

    thumbnail.isGenerating =
      false;

    await thumbnail.save();


    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({

      message:
        "Thumbnail Generated",

      thumbnail,

    });


  } catch (error: any) {

    // ========================================
    // DETAILED ERROR LOG
    // ========================================

    console.error(
      "========================================"
    );

    console.error(
      "THUMBNAIL GENERATION ERROR"
    );

    console.error(
      "FULL ERROR:",
      error
    );

    console.error(
      "ERROR NAME:",
      error?.name
    );

    console.error(
      "ERROR MESSAGE:",
      error?.message
    );

    console.error(
      "ERROR CODE:",
      error?.code
    );

    console.error(
      "ERROR HTTP CODE:",
      error?.http_code
    );

    console.error(
      "ERROR STATUS:",
      error?.response?.status
    );

    console.error(
      "ERROR RESPONSE:",
      error?.response?.data
    );

    console.error(
      "ERROR STACK:",
      error?.stack
    );

    console.error(
      "========================================"
    );


    // ========================================
    // DELETE TEMPORARY FILE
    // ========================================

    if (
      filePath &&
      fs.existsSync(filePath)
    ) {

      try {

        fs.unlinkSync(
          filePath
        );

        console.log(
          "Temporary file deleted"
        );

      } catch (cleanupError) {

        console.error(
          "Temporary file cleanup failed:",
          cleanupError
        );

      }

    }


    // ========================================
    // ERROR MESSAGE
    // ========================================

    let message =
      error?.message ||
      "Failed to generate thumbnail";


    if (
      error?.code ===
      "ECONNABORTED"
    ) {

      message =
        "Pollinations request timed out. Please try again.";

    }


    if (
      error?.code ===
      "ETIMEDOUT"
    ) {

      message =
        "Connection to Pollinations timed out. Please try again.";

    }


    if (
      error?.response?.data
    ) {

      try {

        if (
          typeof error.response.data ===
          "string"
        ) {

          message =
            error.response.data;

        } else {

          message =
            error.response.data?.error?.message ||
            error.response.data?.message ||
            error.response.data?.error ||
            JSON.stringify(
              error.response.data
            );

        }

      } catch {

        message =
          "Pollinations AI request failed";

      }

    }


    // ========================================
    // SEND ERROR
    // ========================================

    return res.status(
      error?.response?.status ||
      error?.http_code ||
      500
    ).json({

      message,

    });

  } finally {

    // ========================================
    // FINAL CLEANUP
    // ========================================

    if (
      filePath &&
      fs.existsSync(filePath)
    ) {

      try {

        fs.unlinkSync(
          filePath
        );

      } catch (cleanupError) {

        console.error(
          "Failed to remove temporary image:",
          cleanupError
        );

      }

    }

  }

};


// ============================================
// DELETE THUMBNAIL
// ============================================

export const deleteThumbnail = async (
  req: Request,
  res: Response
) => {

  try {

    const { id } =
      req.params;

    const { userId } =
      req.session;


    // ========================================
    // AUTH CHECK
    // ========================================

    if (!userId) {

      return res.status(401).json({

        message:
          "Unauthorized. Please login first.",

      });

    }


    // ========================================
    // DELETE THUMBNAIL
    // ========================================

    await Thumbnail.findOneAndDelete({

      _id: id,

      userId,

    });


    // ========================================
    // RESPONSE
    // ========================================

    return res.json({

      message:
        "Thumbnail deleted successfully",

    });

  } catch (error: any) {

    console.error(
      "DELETE THUMBNAIL ERROR:",
      error
    );


    return res.status(500).json({

      message:
        error.message,

    });

  }

};