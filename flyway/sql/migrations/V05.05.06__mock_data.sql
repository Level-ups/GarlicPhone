-- Flyway migration script V05.05.06__mock_data.sql
-- Generates 5 games with 3–5 players each and valid prompt indexes

TRUNCATE TABLE 
  public.images,
  public.prompts,
  public.chains,
  public.player_games,
  public.games,
  public.users
RESTART IDENTITY CASCADE;


-- Generate 10 test users
INSERT INTO public.users (google_sub, name, avatar_url, role_id)
SELECT 
  'google-oauth2|' || (1000 + id),
  'User ' || id,
  'https://example.com/avatar/' || id || '.png',
  CASE WHEN id = 1 THEN 1 ELSE 2 END
FROM generate_series(1, 10) AS id;

-- Generate 5 test games and randomly assign 3–5 players each
WITH games AS (
  INSERT INTO public.games (started_at, url_id)
  SELECT 
    now() - (INTERVAL '1 hour' * gen.id),
    gen_random_uuid()
  FROM generate_series(1, 5) AS gen(id)
  RETURNING id
),
game_players AS (
  SELECT 
    g.id AS game_id,
    floor(random() * 3 + 3)::int AS player_count
  FROM games g
)
INSERT INTO public.player_games (game_id, user_id)
SELECT 
  gp.game_id,
  u.id
FROM game_players gp
CROSS JOIN LATERAL (
  SELECT id 
  FROM public.users 
  WHERE role_id = 2 AND id != 1
  ORDER BY random() 
  LIMIT gp.player_count
) AS u;

-- Create one chain per player-game
INSERT INTO public.chains (game_id)
SELECT game_id
FROM public.player_games;

-- Generate prompts with valid, non-duplicated indexes
WITH
  chain_info AS (
    SELECT
      c.id        AS chain_id,
      c.game_id,
      row_number() OVER (PARTITION BY c.game_id ORDER BY c.id) - 1 AS chain_order
    FROM public.chains c
  ),
  game_players AS (
    SELECT
      game_id,
      user_id,
      row_number() OVER (PARTITION BY game_id ORDER BY user_id) - 1 AS player_order
    FROM public.player_games
  ),
  prompt_steps AS (
    SELECT
      ci.chain_id,
      ci.game_id,
      s.step         AS index,
      gp_drawer.user_id AS user_id
    FROM chain_info ci
    CROSS JOIN generate_series(0, 2) AS s(step)
    JOIN game_players gp_drawer
      ON gp_drawer.game_id = ci.game_id
     AND gp_drawer.player_order = (
           ci.chain_order + s.step
         ) % (
           SELECT count(*) FROM game_players WHERE game_id = ci.game_id
         )
  )
INSERT INTO public.prompts (chain_id, index, text, user_id)
SELECT
  ps.chain_id,
  ps.index,
  'Prompt ' || ps.index || ' for chain ' || ps.chain_id,
  ps.user_id
FROM prompt_steps ps
ORDER BY ps.chain_id, ps.index;

-- Generate images, cycling drawers the same way
WITH prompt_cycle AS (
  SELECT
    p.id          AS prompt_id,
    p.chain_id,
    c.game_id,
    (row_number() OVER (PARTITION BY c.game_id ORDER BY p.id) - 1)
      % gp.player_count AS drawer_order
  FROM public.prompts p
  JOIN public.chains c ON p.chain_id = c.id
  JOIN (
    SELECT game_id, count(*) AS player_count 
    FROM public.player_games 
    GROUP BY game_id
  ) gp ON c.game_id = gp.game_id
)
INSERT INTO public.images (s3_url, prompt_id, user_id)
SELECT
  's3://game-images/' || EXTRACT(EPOCH FROM now()) || '-' || pc.prompt_id || '.png',
  pc.prompt_id,
  pg.user_id
FROM prompt_cycle pc
JOIN (
  SELECT 
    game_id,
    user_id,
    row_number() OVER (PARTITION BY game_id ORDER BY user_id) - 1 AS player_order
  FROM public.player_games
) pg
  ON pc.game_id = pg.game_id
 AND pc.drawer_order = pg.player_order;
