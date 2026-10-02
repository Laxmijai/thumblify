import "dotenv/config";

import { Request, Response } from "express";
import Thumbnail from "../models/Thumbnail.js";
import axios from "axios";

import { v2 as cloudinary } from "cloudinary";

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

const pollinationsApiKey =
    process.env.STABILITY_API_KEY;

if (!pollinationsApiKey) {
    throw new Error(
        "STABILITY_API_KEY is missing from .env"
    );
}

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

export const generateThumbnail = async (
    req: Request,
    res: Response
) => {
    try {
        const { userId } = req.session;

        if (!userId) {
            return res.status(401).json({
                message:
                    "Unauthorized. Please login first.",
            });
        }

        const {
            title,
            prompt: user_prompt,
            style,
            aspect_ratio,
            color_scheme,
            text_overlay,
            text_overlay_text,
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Title is required",
            });
        }

        const thumbnail =
            await Thumbnail.create({
                userId,
                title,
                prompt_used: user_prompt,
                user_prompt,
                style,
                aspect_ratio,
                color_scheme,
                text_overlay,
                text_overlay_text,
                isGenerating: true,
            });

        const selectedStyle =
            stylePrompts[
                style as keyof typeof stylePrompts
            ] ||
            stylePrompts["Bold & Graphic"];

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

        if (
            user_prompt &&
            user_prompt.trim()
        ) {
            prompt += `

Additional requirements:
${user_prompt}
`;
        }

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
            "Generating thumbnail with Pollinations AI..."
        );

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
        }

        const encodedPrompt =
            encodeURIComponent(prompt);

        const generatedImageUrl =
            `https://gen.pollinations.ai/image/${encodedPrompt}` +
            `?model=flux` +
            `&width=${width}` +
            `&height=${height}` +
            `&nologo=true`;

        console.log(
            "Waiting for Pollinations image..."
        );

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
                    timeout: 300000,
                    maxContentLength:
                        Infinity,
                    maxBodyLength:
                        Infinity,
                }
            );

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

        console.log(
            "Uploading image to Cloudinary..."
        );

        const uploadResult =
            await new Promise<any>(
                (resolve, reject) => {
                    const uploadStream =
                        cloudinary.uploader.upload_stream(
                            {
                                resource_type:
                                    "image",
                                timeout:
                                    120000,
                            },
                            (
                                error,
                                result
                            ) => {
                                if (error) {
                                    reject(
                                        error
                                    );
                                } else {
                                    resolve(
                                        result
                                    );
                                }
                            }
                        );

                    uploadStream.end(
                        finalBuffer
                    );
                }
            );

        console.log(
            "Cloudinary upload successful"
        );

        console.log(
            "Cloudinary URL:",
            uploadResult.secure_url
        );

        thumbnail.image_url =
            uploadResult.secure_url;

        thumbnail.isGenerating =
            false;

        await thumbnail.save();

        return res.status(200).json({
            message:
                "Thumbnail Generated",
            thumbnail,
        });

    } catch (error: any) {
        console.error(
            "THUMBNAIL GENERATION ERROR:",
            error
        );

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

        if (error?.response?.data) {
            try {
                if (
                    typeof error.response
                        .data === "string"
                ) {
                    message =
                        error.response.data;
                } else {
                    message =
                        error.response.data
                            ?.error?.message ||
                        error.response.data
                            ?.message ||
                        error.response.data
                            ?.error ||
                        JSON.stringify(
                            error.response.data
                        );
                }
            } catch {
                message =
                    "Pollinations AI request failed";
            }
        }

        return res.status(
            error?.response?.status ||
            error?.http_code ||
            500
        ).json({
            message,
        });
    }
};

export const deleteThumbnail = async (
    req: Request,
    res: Response
) => {
    try {
        const { id } = req.params;
        const { userId } = req.session;

        if (!userId) {
            return res.status(401).json({
                message:
                    "Unauthorized. Please login first.",
            });
        }

        await Thumbnail.findOneAndDelete({
            _id: id,
            userId,
        });

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
            message: error.message,
        });
    }
};