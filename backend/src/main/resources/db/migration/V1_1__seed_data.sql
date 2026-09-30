INSERT INTO app_user (name, email, password_hash)
VALUES ('Default User', 'user@tempo.local', 'no-login-in-mvp');

INSERT INTO board (user_id, name)
SELECT id, 'My board' FROM app_user WHERE email = 'user@tempo.local';

INSERT INTO board_column (board_id, name, position)
SELECT b.id, c.name, c.position
FROM board b
CROSS JOIN (VALUES ('To do', 0), ('Doing', 1), ('Done', 2)) AS c (name, position)
WHERE b.name = 'My board';
