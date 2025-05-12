import { ErrorDetails, InsertErrorDetails, NotFoundErrorDetails } from "../library/error-types";
import { Either } from "../library/types";
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
    return [undefined, new ErrorDetails("Error retrieving image", [error.message])];
  }
}

export async function getImagesByPromptId(promptId: number): Promise<Either<Image[], ErrorDetails>> {
  try {
    const images = await imageRepository.getImagesByPromptId(promptId);
    return [images, undefined];
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error retrieving images", [error.message])];
  }
}

export async function createImage(imageUploadDto: ImageUploadDto, filename: string): Promise<Either<Image, ErrorDetails>> {
  const [s3Result, error] = await imageRepository.uploadImageToS3(imageUploadDto.image, filename);
  
  if (error) {
    return [undefined, error];
  } else {
    // continue with the rest of the function
  }

  const image: InsertImageDto = {
    s3Url: s3Result.Location,
    promptId: imageUploadDto.promptId,
    userId: imageUploadDto.userId
  };
  
  try {
    const createdImage = await imageRepository.insertImage(image);
    if (!createdImage) {
      return [undefined, new InsertErrorDetails("Could not create image")];
    } else {
      return [createdImage, undefined];
    }
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error creating image", [error.message])];
  }
}

export default {
  getImageById,
  getImagesByPromptId,
  createImage
};