DROP TABLE IF EXISTS dispo_tailles cascade;
DROP TABLE IF EXISTS accessoires cascade;
DROP TABLE IF EXISTS produits_accessoires cascade;
DROP TABLE IF EXISTS clients cascade;
DROP TABLE IF EXISTS produits cascade;
DROP TABLE IF EXISTS produit_commande cascade;
DROP TABLE IF EXISTS produits_uniques_commandes;
DROP TABLE IF EXISTS combinaisons_commandes;
DROP TABLE IF EXISTS commandes cascade;
DROP TABLE IF EXISTS gerants;
DROP TABLE IF EXISTS combinaisons_parts cascade;
DROP TABLE IF EXISTS combinaisons cascade;

CREATE TABLE clients(
    id_client SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    tel VARCHAR(12) NOT NULL,
    email VARCHAR(255) NOT NULL,
    adresse VARCHAR(255) NOT NULL,
    adresse2 VARCHAR(255) NOT NULL,
    ville VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
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
    image TEXT NOT NULL,
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
    image TEXT NOT NULL,
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
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    heureLivraison VARCHAR(10) NOT NULL,
    tel VARCHAR(12) NOT NULL,
    email VARCHAR(255) NOT NULL,
    adresse VARCHAR(255) NOT NULL,
    adresse2 VARCHAR(255) NOT NULL,
    ville VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    archived BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id_commande)
);

-- Table qui lie à une commande un produit ainsi que son accessoire et sa taille
CREATE TABLE produit_commande(
    id_produit_commande SERIAL,
    id_produit INT NOT NULL,
    id_accessoire INT,
    taille VARCHAR(10) NOT NULL,
    PRIMARY KEY (id_produit_commande),
    FOREIGN KEY (id_produit) REFERENCES produits(id_produit),
    FOREIGN KEY (id_accessoire) REFERENCES accessoires(id_accessoire),
    FOREIGN KEY (id_produit, taille) REFERENCES dispo_tailles(id_produit, taille)
);

-- Tablie qui lie à une commande un produit et une quantité
CREATE TABLE produits_uniques_commandes(
    id_produit_unique SERIAL,
    id_produit_commande INT NOT NULL,
    id_commande INT NOT NULL,
    quantite INT NOT NULL,
    PRIMARY KEY (id_produit_unique),
    FOREIGN KEY (id_produit_commande) REFERENCES produit_commande(id_produit_commande),
    FOREIGN KEY (id_commande) REFERENCES commandes(id_commande)
);

-- Table qui lie les combinaisons à une commande
CREATE TABLE combinaisons_commandes(
    id_combinaison_commande SERIAL,
    id_combinaison INT NOT NULL,
    id_commande INT NOT NULL,
    id_produit_commande1 INT NOT NULL,
    id_produit_commande2 INT NOT NULL,
    id_produit_commande3 INT NOT NULL,
    quantite INT NOT NULL,
    PRIMARY KEY (id_combinaison_commande),
    FOREIGN KEY (id_combinaison) REFERENCES combinaisons(id_combinaison),
    FOREIGN KEY (id_commande) REFERENCES commandes(id_commande),
    FOREIGN KEY (id_produit_commande1) REFERENCES produit_commande(id_produit_commande),
    FOREIGN KEY (id_produit_commande2) REFERENCES produit_commande(id_produit_commande),
    FOREIGN KEY (id_produit_commande3) REFERENCES produit_commande(id_produit_commande)
);



INSERT INTO produits(nom_produit, type_produit, marque, genre, prix, image) VALUES
('Jean slim bleu', 'pantalons', 'Levi''s', 'homme', 19, '/resources/jean slim.png'),
('Jean boyfriend délavé', 'pantalons', 'Zara', 'femme', 14, '/resources/jean boyfriend.png'),
('Chino beige', 'pantalons', 'Gap', 'homme', 24, '/resources/chino beige.png'),
('Pantalon taille haute noir', 'pantalons', 'H&M', 'femme', 29, '/resources/pantalon taille haute noir.png'),
('Chemise en lin blanc', 'chemises', 'Uniqlo', 'homme', 39, '/resources/chemise blanche.png'),
('Chemise en jean bleu', 'chemises', 'Levi''s', 'femme', 49, '/resources/chemise en jean bleu.png'),
('Chemise à rayures fines', 'chemises', 'Ralph Lauren', 'homme', 79, '/resources/chemise rayures bleues.png'),
('Chemisier en soie noir', 'chemises', 'Sandro', 'femme', 129, '/resources/chemise soie noir.png'),
('Veste en laine camel', 'vestes', 'Mango', 'homme', 89, '/resources/veste laine camel.png'),
('Veste en cuir noir', 'vestes', 'The Kooples', 'femme', 59, '/resources/veste en cuir noir.png'),
('Veste en jean délavé', 'vestes', 'Zara', 'homme', 49, '/resources/veste en jean delave.png'),
('Veste en laine bouclée beige', 'vestes', 'Sandro', 'femme', 199, '/resources/Veste en laine bouclee beige.png'),
('Pull en laine col roulé gris', 'pulls', 'H&M', 'homme', 29, '/resources/col roule gris.png'),
('Pull en cachemire rose poudré', 'pulls', 'Uniqlo', 'femme', 129, '/resources/pull rose.png'),
('Pull à motifs géométriques', 'pulls', 'Zara', 'homme', 39, '/resources/pull geo.png'),
('Pull en laine à col V', 'pulls', 'Mango', 'femme', 59, '/resources/pull col v gris.png'),
('Short en jean déchiré', 'shorts', 'Levi''s', 'homme', 29, '/resources/short jean dechire.png'),
('Short en lin beige', 'shorts', 'H&M', 'femme', 14, '/resources/short lin beige.png'),
('Short en jean taille haute', 'shorts', 'Zara', 'femme', 19, '/resources/short jean haut.png'),
('Chaussettes hautes en laine', 'chaussettes', 'Falke', 'homme', 14, '/resources/Chaussettes hautes en laine.png'),
('Chaussettes en coton coloré', 'chaussettes', 'Happy Socks', 'femme', 9, '/resources/Chaussettes en coton colore.png'),
('Robe en coton imprimé', 'robes', 'Sandro', 'femme', 49, '/resources/robe coton.png'),
('Costume complet gris', 'costumes', 'Hugo Boss', 'homme', 99, '/resources/costume complet gris.png'),
('Blazer en laine marine', 'vestes', 'Ralph Lauren', 'homme', 49, '/resources/Blazer en laine marine.png'),
('Manteau en laine beige', 'manteaux', 'Sandro', 'femme', 29, '/resources/Manteau en laine beige.png'),
('Parka kaki avec fausse fourrure', 'manteaux', 'Zara', 'homme', 129, '/resources/Parka kaki avec fausse fourrure.png'),
('Blouson en cuir marron', 'vestes', 'The Kooples', 'homme', 93, '/resources/Blouson en cuir marron.png'),
('Jean slim noir', 'pantalons', 'Diesel', 'homme', 59, '/resources/Jean slim noir.png'),
('Jean coupe droite', 'pantalons', 'Tommy Hilfiger', 'femme', 69, '/resources/Jean coupe droite.png'),
('Chino vert', 'pantalons', 'Lacoste', 'homme', 79, '/resources/Chino vert.png'),
('Pantalon taille haute blanc', 'pantalons', 'Calvin Klein', 'femme', 89, '/resources/Pantalon taille haute blanc.png'),
('Chemise en lin rayé', 'chemises', 'Armani', 'homme', 99, '/resources/chemise lin raye.png'),
('Chemise en jean noir', 'chemises', 'Gucci', 'femme', 159, '/resources/Chemise en jean noir.png'),
('Chemise à carreaux', 'chemises', 'Burberry', 'homme', 129, '/resources/Chemise a carreaux.png'),
('Chemisier en soie blanc', 'chemises', 'Chloé', 'femme', 29, '/resources/Chemisier en soie blanc.png'),
('Veste en laine bleu marine', 'vestes', 'Balenciaga', 'homme', 39, '/resources/Veste en laine bleu marine.png'),
('Veste en cuir rouge', 'vestes', 'Saint Laurent', 'femme', 59, '/resources/Veste en cuir rouge.png'),
('Veste en jean brut', 'vestes', 'Dolce & Gabbana', 'homme', 29, '/resources/Veste en jean brut.png'),
('Veste en laine bouclée noir', 'vestes', 'Prada', 'femme', 69, '/resources/Veste en laine bouclee noir.png'),
('Pull en laine col roulé noir', 'pulls', 'Versace', 'homme', 179, '/resources/Pull en laine col roule noir.png'),
('Pantalon cargo kaki', 'pantalons', 'Timberland', 'homme', 64, '/resources/Pantalon cargo kaki.png'),
('Legging noir', 'pantalons', 'Adidas', 'femme', 34, '/resources/Legging noir.png'),
('Chino rouge', 'pantalons', 'Fred Perry', 'homme', 84, '/resources/Chino rouge.png'),
('Pantalon taille haute rayé', 'pantalons', 'Ted Baker', 'femme', 104, '/resources/Pantalon taille haute raye.png'),
('Chemise en popeline blanche', 'chemises', 'Paul Smith', 'homme', 119, '/resources/Chemise en popeline blanche.png'),
('Chemise en soie verte', 'chemises', 'Givenchy', 'femme', 59, '/resources/Chemise en soie verte.png'),
('Chemise à pois', 'chemises', 'Kenzo', 'homme', 39, '/resources/Chemise a pois.png'),
('Chemisier en dentelle rose', 'chemises', 'Miu Miu', 'femme', 49, '/resources/Chemisier en dentelle rose.png'),
('Veste en laine grise', 'vestes', 'Alexander McQueen', 'homme', 99, '/resources/Veste en laine grise.png'),
('Veste en daim beige', 'vestes', 'Loewe', 'femme', 79, '/resources/Veste en daim beige.png'),
('Veste en jean noir', 'vestes', 'Valentino', 'homme', 39, '/resources/Veste en jean noirr.png'),
('Veste en velours bordeaux', 'vestes', 'Fendi', 'femme', 89, '/resources/Veste en velours bordeaux.png'),
('Pull en laine col roulé bleu', 'pulls', 'Roberto Cavalli', 'homme', 89, '/resources/Pull en laine col roule bleu.png'),
('Pull en cachemire rouge', 'pulls', 'Stella McCartney', 'femme', 29, '/resources/Pull en cachemire rouge.png'),
('Short cargo', 'shorts', 'Carhartt', 'homme', 49, '/resources/short cargo.png');

INSERT INTO accessoires(nom_accessoire, type_accessoire, type_produit) VALUES
('Ceinture en cuir', 'Ceinture', 'pantalons'),
('Bretelles fines', 'Bretelles', 'pantalons'),
('Bretelles larges', 'Bretelles', 'pantalons'),
('Cravate slim', 'Cravate', 'chemises'),
('Cravate classique', 'Cravate', 'chemises'),
('Nœud papillon', 'Nœud papillon', 'chemises'),
('Pochette de costume', 'Pochette', 'chemises'),
('Ceinture en tissu', 'Ceinture', 'pantalons'),
('Écharpe en laine', 'Écharpe', 'vestes'),
('Bonnet en laine', 'Bonnet', 'vestes'),
('Collier', 'Collier', 'chemises'),
('Bracelet', 'Bracelet', 'chemises'),
('Ceinture tressée', 'Ceinture', 'pantalons'),
('Bretelles à motifs', 'Bretelles', 'pantalons'),
('Cravate large', 'Cravate', 'chemises'),
('Foulard en soie', 'Foulard', 'chemises'),
('Ceinture en métal', 'Ceinture', 'pantalons'),
('Écharpe en soie', 'Écharpe', 'vestes'),
('Bonnet en cachemire', 'Bonnet', 'vestes');

INSERT INTO dispo_tailles(id_produit, taille, quantite) VALUES
(1, 'XS', 4),
(1, 'XXL', 2),
(2, 'L', 4),
(2, 'XL', 3),
(2, 'XXL', 3),
(6, 'S', 3),
(6, 'M', 2),
(6, 'L', 2),
(6, 'XL', 1),
(12, 'XS', 2),
(12, 'M', 4),
(12, 'XL', 3),
(12, 'XXL', 1),
(28, 'S', 4),
(28, 'M', 4),
(28, 'L', 4),
(28, 'XL', 2),
(31, 'XS', 2),
(31, 'S', 3),
(31, 'M', 4),
(31, 'L', 3),
(31, 'XL', 2),
(42, 'S', 3),
(42, 'M', 4),
(42, 'L', 4),
(42, 'XL', 2),
(45, 'XS', 1),
(45, 'S', 3),
(45, 'M', 4),
(45, 'L', 3),
(45, 'XL', 2),
(3, 'M', 3),
(3, 'L', 4),
(4, 'S', 3),
(4, 'M', 4),
(7, 'L', 3),
(7, 'XL', 1),
(8, 'XS', 2),
(8, 'S', 4),
(13, 'M', 4),
(13, 'L', 4),
(14, 'XS', 1),
(14, 'S', 3),
(19, 'M', 3),
(19, 'L', 3),
(20, 'S', 3),
(20, 'M', 4),
(25, 'L', 4),
(25, 'XL', 2),
(26, 'S', 3),
(9, 'M', 1),
(9, 'L', 1),
(11, 'S', 1),
(26, 'M', 2),
(32, 'M', 1),
(32, 'L', 1),
(33, 'S', 1),
(33, 'M', 2),
(5, 'M', 1),
(30, 'S', 1),
(30, 'M', 2),
(43, 'XL', 1),
(43, 'S', 1),
(46, 'S', 3),
(5, 'L', 1);

INSERT INTO produits_accessoires (id_produit, id_accessoire) VALUES
(1, 1),
(3, 3),
(28, 8),
(29, 9),
(30, 10),
(31, 11),
(42, 12),
(43, 13),
(44, 14),
(45, 15),
(46,16),
(35, 10),
(47, 11);

INSERT INTO combinaisons (type,prix,image) VALUES
('Combinaison de base',60,'/resources/combi de base1.png'),
('Combinaison de base',60,'/resources/combi de base2.png'),
('Combinaison business',100,'/resources/combi business.png'),
('Combinaison de luxe',200,'/resources/combi luxe1.png'),
('Combinaison de luxe',200,'/resources/combi de luxe2.png');

INSERT INTO combinaisons_parts (id_combi, id_produit) VALUES
-- Combinaisons de base
(1,4),
(1,32),
(1,9),
(2,41),
(2,33),
(2,11),

-- Combinaison business
(3,30),
(3,33),
(3,12),

-- Combinaisons luxe
(4,31),
(4,35),
(4,47),
(5,43),
(5,45),
(5,46);


INSERT INTO gerants(login,mdp) VALUES('admin',sha256('admin'));
INSERT INTO clients(nom,prenom,tel,email,adresse,adresse2,ville,code,login,mdp) VALUES('nomTest','test','0102030405','test@gmail.com','1 rue du test','','Paris','75013','test',sha256('123456789'));