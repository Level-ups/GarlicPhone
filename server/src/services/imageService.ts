import { Either } from "../../../lib/types";
import { ErrorDetails, InsertErrorDetails, NotFoundErrorDetails } from "../library/error-types";
import { Image, ImageUploadDto, InsertImageDto } from "../models/Image";
import imageRepository from "../repositories/imageRepository";

export async function getImageById(id: number): Promise<Either<Image, ErrorDetails>> {
  try {
    const image = await imageRepository.getImageById(id);
    if (!image) {
      return [undefined, new NotFoundErrorDetails("Image not found")];
    } else {
      return [image, undefined];
    }
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error retrieving image", [error.message], error.stack)];
  }
}

export async function getImagesByPromptId(promptId: number): Promise<Either<Image[], ErrorDetails>> {
  try {
    const images = await imageRepository.getImagesByPromptId(promptId);
    return [images, undefined];
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error retrieving images", [error.message], error.stack)];
  }
}

export async function createImage(imageUploadDto: ImageUploadDto, filename: string): Promise<Either<Image, ErrorDetails>> {
  // Upload image to S3
  const [s3Result, error] = await imageRepository.uploadImageToS3(imageUploadDto.image, filename);
  
  if (error) {
    return [undefined, error];
  }

  const image: InsertImageDto = {
    s3Url: s3Result.Location,
    promptId: imageUploadDto.chainId,
    userId: imageUploadDto.userId
  };
  
  // Insert image into database
  try {
    const createdImage = await imageRepository.insertImage(image);
    if (!createdImage) {
      return [undefined, new InsertErrorDetails("Could not create image")];
    } else {
      return [createdImage, undefined];
    }
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error creating image", [error.message], error.stack)];
  }
}

export async function getLatestImageByChainId(chainId: number): Promise<Either<Image, ErrorDetails>> {
  try {
    const image = await imageRepository.getLatestImageFromChain(chainId);
    return [image, undefined];
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error retrieving images", [error.message], error.stack)];
  }
}

export async function insertImageToLatestPromptInChain(chainId: number, userId: number, s3Url: string): Promise<Either<Image, ErrorDetails>> {
  try {
    const image = await imageRepository.insertImageToLatestPromptInChain(chainId, userId, s3Url);
    return [image, undefined];
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error retrieving images", [error.message], error.stack)];
  }
}

export default {
  getImageById,
  getImagesByPromptId,
  createImage,
  getLatestImageByChainId,
  insertImageToLatestPromptInChain,
};