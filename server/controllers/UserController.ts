import Thumbnail from "../models/Thumbnail.js";
import { Request , Response } from "express";

// Controller to get all thumbnails of a user
export const getUserThumbnails = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.session;

    const thumbnails = await Thumbnail.find({ userId });

    res.json({ thumbnails });
  } catch (error: any) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};


// Controller to get single Thumbnail of a User
export const getThumbnailbyId = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.session;
    const { id } = req.params;

    const thumbnail = await Thumbnail.findOne({
      userId,
      _id: id,
    });

    res.json({ thumbnail });
  } catch (error: any) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};