ALTER TABLE games
DROP COLUMN url_id;

ALTER TABLE games
ADD url_id uuid;