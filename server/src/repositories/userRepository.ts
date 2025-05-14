import pool from '../library/db';
import { userMapper } from '../library/mappers';
import { User, UserDto } from '../models/User';

async function findAllUsers(): Promise<User[]> {
  const query = `
    SELECT 
      u.id AS user_id,
      u.google_sub,
      u.name,
      u.avatar_url,
      r.id AS role_id,
      r.name AS role_name 
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
  `;

  const result = await pool.query(query);
  return result.rows.map((row: any) => userMapper.toDomain(row))
}

async function findUserById(id: string): Promise<User | null> {
  const query = `
    SELECT 
      u.id AS user_id,
      u.google_sub,
      u.name,
      u.avatar_url,
      r.id AS role_id,
      r.name AS role_name 
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    WHERE u.id = $1
  `;

  const result = await pool.query(
    query,
    [id]
  );
  return result.rows.length > 0 ? userMapper.toDomain(result.rows[0]) : null;
}

async function findUserByGoogleId(id: string): Promise<User | null> {
  const query = `
    SELECT 
      u.id AS user_id,
      u.google_sub,
      u.name,
      u.avatar_url,
      r.id AS role_id,
      r.name AS role_name 
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    WHERE u.id = $1
  `;

  const result = await pool.query(
    query,
    [id]
  );
  return result.rows.length > 0 ? userMapper.toDomain(result.rows[0]) : null;
}

async function insertUser(userData: UserDto): Promise<User> {
  const query = `
    WITH target_role AS (
      SELECT id
      FROM roles
      WHERE name = $1
    ),
    inserted_user AS (
      INSERT INTO users (google_sub, name, avatar_url, role_id)
      SELECT $2, $3, $4, target_role.id
      FROM target_role
      RETURNING id, google_sub, name, avatar_url, role_id
    )
    SELECT 
      iu.id AS user_id,
      iu.google_sub,
      iu.name,
      iu.avatar_url,
      r.id AS role_id,
      r.name AS role_name
    FROM inserted_user iu
    INNER JOIN roles r ON iu.role_id = r.id;
  `;

  const result = await pool.query(
    query,
    [userData.roleName, userData.googleSub, userData.name, userData.avatarUrl]
  );
  return userMapper.toDomain(result.rows[0]);
}

async function updateUser(id: string, userData: UserDto): Promise<User | null> {
  const query = `
    WITH target_role AS (
      SELECT id
      FROM roles
      WHERE name = $1
    ),
    updated_user AS (
      UPDATE users
      SET
        name = COALESCE($2, name),
        avatar_url = COALESCE($3, avatar_url),
        role_id = COALESCE(target_role.id, role_id)
      FROM target_role
      WHERE id = $4
      RETURNING id, google_sub, name, avatar_url, role_id;
    )
    SELECT
      uu.id AS user_id,
      uu.google_sub,
      uu.name,
      uu.avatar_url,
      r.id AS role_id,
      r.name AS role_name
    FROM updated_user uu
    INNER JOIN roles r ON uu.role_id = r.id;
  `;

  const result = await pool.query(
    query,
    [userData.roleName, userData.name, userData.avatarUrl, id]
  );
  return result.rows.length > 0 ? userMapper.toDomain(result.rows[0]) : null;
}

async function deleteUser(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  return result.rows.length > 0;
}

const userRepository = {
  findAllUsers,
  findUserById,
  insertUser,
  updateUser,
  deleteUser,
  findUserByGoogleId
};

export default userRepository;
