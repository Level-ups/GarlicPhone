import { ManagedUpload } from 'aws-sdk/clients/s3';
import pool from '../library/db';
import { ErrorDetails } from '../library/error-types';
import { imageMapper } from '../library/mappers';
import s3 from '../library/s3';
import { Either } from '../library/types';
import { Image, InsertImageDto } from '../models/Image';

async function getImageById(id: number): Promise<Image | null> {
  const query = `
    SELECT
      i.id AS image_id,
      i.s3_url,
      i.prompt_id,
      p.chain_id,
      p.index,
      p.text,
      p.user_id AS prompt_user_id,
      p.created_at AS prompt_created_at,
      u.id AS user_id,
      u.google_sub,
      u.name,
      u.avatar_url,
      r.id AS role_id,
      r.name AS role_name,
      g.id AS game_id,
      g.started_at,
      g.url_id
    FROM images i
    INNER JOIN prompts p ON i.prompt_id = p.id
    INNER JOIN users u ON i.user_id = u.id
    INNER JOIN roles r ON u.role_id = r.id
    INNER JOIN chains c ON c.id = p.chain_id
    INNER JOIN games g ON g.id = c.game_id
    WHERE i.id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows.length ? imageMapper.toDomain(result.rows[0]) : null;
}

async function getImagesByPromptId(promptId: number): Promise<Image[]> {
  const query = `
    SELECT
      i.id AS image_id,
      i.s3_url,
      i.prompt_id,
      p.chain_id,
      p.index,
      p.text,
      p.user_id AS prompt_user_id,
      p.created_at AS prompt_created_at,
      u.id AS user_id,
      u.google_sub,
      u.name,
      u.avatar_url,
      r.id AS role_id,
      r.name AS role_name,
      g.id AS game_id,
      g.started_at,
      g.url_id
    FROM images i
    INNER JOIN prompts p ON i.prompt_id = p.id
    INNER JOIN users u ON i.user_id = u.id
    INNER JOIN roles r ON u.role_id = r.id
    INNER JOIN chains c ON c.id = p.chain_id
    INNER JOIN games g ON g.id = c.game_id
    WHERE i.prompt_id = $1
  `;

  const result = await pool.query(query, [promptId]);
  return result.rows.map(row => imageMapper.toDomain(row));
}

async function insertImage(image: InsertImageDto): Promise<Image | null> {
  const query = `
    WITH inserted_image AS (
      INSERT INTO images (s3_url, prompt_id, user_id)
      VALUES ($1, $2, $3)
      RETURNING id, s3_url, prompt_id, user_id
    )
    SELECT
      i.id AS image_id,
      i.s3_url,
      i.prompt_id,
      p.chain_id,
      p.index,
      p.text,
      p.user_id AS prompt_user_id,
      p.created_at AS prompt_created_at,
      u.id AS user_id,
      u.google_sub,
      u.name,
      u.avatar_url,
      r.id AS role_id,
      r.name AS role_name,
      g.id AS game_id,
      g.started_at,
      g.url_id
    FROM inserted_image i
    INNER JOIN prompts p ON i.prompt_id = p.id
    INNER JOIN users u ON i.user_id = u.id
    INNER JOIN roles r ON u.role_id = r.id
    INNER JOIN chains c ON c.id = p.chain_id
    INNER JOIN games g ON g.id = c.game_id
  `;

  const result = await pool.query(
    query,
    [image.s3Url, image.promptId, image.userId]
  );
  return result.rows.length ? imageMapper.toDomain(result.rows[0]) : null;
}

async function uploadImageToS3(image: Buffer, filename: string): Promise<Either<ManagedUpload.SendData, ErrorDetails>> {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: filename,
    Body: image,
    ContentType: 'image/png',
  };

  try {
    const data = await s3.upload(params).promise();
    return [data];
  } catch (error: any) {
    return [undefined, new ErrorDetails('Error uploading image to S3', [error.message], error.stack)];
  }
}

export default {
  getImageById,
  getImagesByPromptId,
  insertImage,
  uploadImageToS3,
};