DROP TABLE IF EXISTS dispo_tailles cascade;
DROP TABLE IF EXISTS accessoires cascade;
DROP TABLE IF EXISTS produits_accessoires cascade;
DROP TABLE IF EXISTS clients cascade;
DROP TABLE IF EXISTS produits cascade;
DROP TABLE IF EXISTS produits_commandes cascade;
DROP TABLE IF EXISTS commandes cascade;
DROP TABLE IF EXISTS gerants;
DROP TABLE IF EXISTS combinaisons_parts cascade;
DROP TABLE IF EXISTS combinaisons cascade;

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
    prix DECIMAL(10,2) NOT NULL,
    createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accessoires(
    id_accessoire SERIAL PRIMARY KEY,
    nom_accessoire VARCHAR(255) NOT NULL,
    type_accessoire VARCHAR(255) NOT NULL,
    type_produit VARCHAR(255) NOT NULL
);

CREATE TABLE produits_accessoires(
    id_produit INT NOT NULL,
    id_accessoire INT NOT NULL,
    PRIMARY KEY (id_produit, id_accessoire),
    FOREIGN KEY (id_produit) REFERENCES produits(id_produit),
    FOREIGN KEY (id_accessoire) REFERENCES accessoires(id_accessoire)
);

CREATE TABLE dispo_tailles(
    id_produit INT NOT NULL,
    taille VARCHAR(10) NOT NULL,
    quantite INT NOT NULL,
    PRIMARY KEY (id_produit, taille),
    FOREIGN KEY (id_produit) REFERENCES produits(id_produit)
);

CREATE TABLE combinaisons(
    id_combinaison SERIAL,
    type VARCHAR(255) NOT NULL,
    prix DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id_combinaison)
);

CREATE TABLE combinaisons_parts(
    id_partie SERIAL,
    id_combi INT NOT NULL,
    id_produit INT NOT NULL,
    PRIMARY KEY (id_partie),
    FOREIGN KEY (id_combi) REFERENCES combinaisons(id_combinaison),
    FOREIGN KEY (id_produit) REFERENCES produits(id_produit)
);

CREATE TABLE commandes(
    id_commande SERIAL,
    id_client INT NOT NULL,
    PRIMARY KEY (id_commande),
    FOREIGN KEY (id_client) REFERENCES clients(id_client)
);

CREATE TABLE produits_commandes(
    id_produit INT NOT NULL,
    id_commande INT NOT NULL,
    taille VARCHAR(10) NOT NULL,
    quantite INT NOT NULL,
    PRIMARY KEY (id_produit, id_commande, taille),
    FOREIGN KEY (id_produit) REFERENCES produits(id_produit),
    FOREIGN KEY (id_commande) REFERENCES commandes(id_commande),
    FOREIGN KEY (id_produit, taille) REFERENCES dispo_tailles(id_produit, taille)
);