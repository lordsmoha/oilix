-- Exécuter dans psql ou pgAdmin (en tant que superutilisateur, ex. postgres)
-- Crée la base utilisée par Oilix

CREATE DATABASE oilix
  WITH ENCODING 'UTF8'
  LC_COLLATE = 'French_France.1252'
  LC_CTYPE = 'French_France.1252'
  TEMPLATE template0;

-- Optionnel : utilisateur dédié (recommandé en production)
-- CREATE USER oilix WITH PASSWORD 'votre_mot_de_passe';
-- GRANT ALL PRIVILEGES ON DATABASE oilix TO oilix;
