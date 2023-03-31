DROP TABLE IF EXISTS dispo_tailles cascade;
DROP TABLE IF EXISTS accessoires cascade;
DROP TABLE IF EXISTS produits_accessoires cascade;
DROP TABLE IF EXISTS tailles cascade;
DROP TABLE IF EXISTS clients cascade;
DROP TABLE IF EXISTS produits cascade;
DROP TABLE IF EXISTS gerants;

CREATE TABLE clients(
    id_client SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    adresse VARCHAR(255) NOT NULL,
    login VARCHAR(255) NOT NULL,
    mdp TEXT NOT NULL
);

CREATE TABLE gerants(
    id_gerant SERIAL PRIMARY KEY,
    login VARCHAR(255) NOT NULL,
    mdp TEXT NOT NULL
);

CREATE TABLE produits(
    id_produit SERIAL PRIMARY KEY,
    nom_produit VARCHAR(255) NOT NULL,
    type_produit VARCHAR(255) NOT NULL,
    marque VARCHAR(255) NOT NULL,
    genre VARCHAR(255) NOT NULL,
    prix DECIMAL(10,2) NOT NULL
);

CREATE TABLE accessoires(
    id_accessoire SERIAL PRIMARY KEY,
    nom_accessoire VARCHAR(255) NOT NULL,
    type_accessoire VARCHAR(255) NOT NULL
);

CREATE TABLE produits_accessoires(
    id_produit INT NOT NULL,
    id_accessoire INT NOT NULL,
    PRIMARY KEY (id_produit, id_accessoire),
    FOREIGN KEY (id_produit) REFERENCES produits(id_produit),
    FOREIGN KEY (id_accessoire) REFERENCES accessoires(id_accessoire)
);

CREATE TABLE tailles(
    id_taille SERIAL PRIMARY KEY,
    taille VARCHAR(10) NOT NULL
);

CREATE TABLE dispo_tailles(
    id_produit INT NOT NULL,
    id_taille INT NOT NULL,
    quantite INT NOT NULL,
    PRIMARY KEY (id_produit, id_taille),
    FOREIGN KEY (id_produit) REFERENCES produits(id_produit),
    FOREIGN KEY (id_taille) REFERENCES tailles(id_taille)
);
