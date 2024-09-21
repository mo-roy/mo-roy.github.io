// server/api/portfolio-items.js
import fs from 'fs/promises';
import path from 'path';
import { defineEventHandler, sendError, createError, send } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    // Use 'process.cwd()' to get the current directory
    const imagesPath = path.join(process.cwd(), 'public', 'images');
    const videosPath = path.join(process.cwd(), 'public', 'videos');

    // Read files from images and videos directories
    const imageFiles = await fs.readdir(imagesPath);
    const videoFiles = await fs.readdir(videosPath);

    const portfolioItems = [];

    // Define a regular expression to match the naming convention
    const imagePattern = /^p(\d{1,2})\.jpg$/; // Matches 'p01.jpg', 'p12.jpg', etc.
    const videoPattern = /^video-(\d{1,2})\.mp4$/; // Matches 'video-01.mp4', 'video-12.mp4', etc.

    // Create a map to store video associations
    const videoMap = new Map();

    // Populate the video map with available videos
    videoFiles.forEach((file) => {
      const match = file.match(videoPattern);
      if (match) {
        const pageNumber = match[1]; // Extract number from video filename
        videoMap.set(pageNumber, `/videos/${file}`);
      }
    });

    // Create portfolio items based on image files
    imageFiles.forEach((file) => {
      const match = file.match(imagePattern);
      if (match) {
        const pageNumber = match[1]; // Extract number from image filename
        const associatedVideo = videoMap.get(pageNumber) || null; // Get the associated video or null
        portfolioItems.push({
          type: 'image',
          src: `/images/${file}`,
          alt: `Image: ${file}`,
          associatedVideo: associatedVideo // Associate the video if available
        });
      }
    });

    // Send the portfolio items as response using 'send' method from 'h3'
    return portfolioItems;

  } catch (error) {
    console.error("Error reading portfolio items:", error);

    // Handle the error properly using 'sendError' and 'createError' from 'h3'
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Failed to load portfolio items',
      data: error.message
    }));
  }
});
