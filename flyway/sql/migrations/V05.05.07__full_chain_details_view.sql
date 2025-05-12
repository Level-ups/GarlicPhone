CREATE OR REPLACE VIEW full_chain_details AS
SELECT
    -- Game Details
    g.id AS game_id,
    g.started_at AS game_started_at,
    g.url_id AS game_url_id,
    
    -- Chain Details
    c.id AS chain_id,
    c.game_id AS chain_game_id,
    
    -- Prompt Details
    p.id AS prompt_id,
    p.chain_id AS prompt_chain_id,
    p.index AS prompt_index,
    p.text AS prompt_text,
    p.created_at AS prompt_created_at,
    
    -- Image Details
    i.id AS image_id,
    i.s3_url AS image_s3_url,
    i.prompt_id AS image_prompt_id,
    
    pu.id AS prompt_user_id,
    pu.google_sub AS prompt_user_google_sub,
    pu.name AS prompt_user_name,
    pu.avatar_url AS prompt_user_avatar_url,
    pu.role_id AS prompt_user_role_id,
    pr.name AS prompt_user_role_name,  -- New role name
    
    -- Image Author Details
    iu.id AS image_user_id,
    iu.google_sub AS image_user_google_sub,
    iu.name AS image_user_name,
    iu.avatar_url AS image_user_avatar_url,
    iu.role_id AS image_user_role_id,
    ir.name AS image_user_role_name    -- New role name

FROM public.chains c
INNER JOIN public.games g ON c.game_id = g.id
INNER JOIN public.prompts p ON c.id = p.chain_id
LEFT JOIN public.images i ON p.id = i.prompt_id
INNER JOIN public.users pu ON p.user_id = pu.id
INNER JOIN public.roles pr ON pu.role_id = pr.id  -- New join
LEFT JOIN public.users iu ON i.user_id = iu.id
LEFT JOIN public.roles ir ON iu.role_id = ir.id   -- New join
ORDER BY
    g.id ASC, 
    c.id ASC,
    p.index ASC,
    p.id ASC;