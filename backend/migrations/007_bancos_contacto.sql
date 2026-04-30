-- Agrega campos de contacto a la tabla bancos
ALTER TABLE bancos
  ADD COLUMN IF NOT EXISTS contacto  VARCHAR(150),
  ADD COLUMN IF NOT EXISTS correo    VARCHAR(150),
  ADD COLUMN IF NOT EXISTS telefono  VARCHAR(50);
