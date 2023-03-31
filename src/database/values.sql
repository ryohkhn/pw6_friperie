INSERT INTO produits(nom_produit, type_produit, marque, genre, prix) VALUES
('Jean slim bleu', 'pantalon', 'Levi''s', 'homme', 19.99),
('Jean boyfriend délavé', 'pantalon', 'Zara', 'femme', 14.99),
('Chino beige', 'pantalon', 'Gap', 'homme', 24.99),
('Pantalon taille haute noir', 'pantalon', 'H&M', 'femme', 29.99),
('Chemise en lin blanc', 'chemise', 'Uniqlo', 'homme', 39.99),
('Chemise en jean bleu', 'chemise', 'Levi''s', 'femme', 49.99),
('Chemise à rayures fines', 'chemise', 'Ralph Lauren', 'homme', 79.99),
('Chemisier en soie noir', 'chemise', 'Sandro', 'femme', 129.99),
('Veste en laine camel', 'veste', 'Mango', 'homme', 89.99),
('Veste en cuir noir', 'veste', 'The Kooples', 'femme', 259.99),
('Veste en jean délavé', 'veste', 'Zara', 'homme', 49.99),
('Veste en laine bouclée beige', 'veste', 'Sandro', 'femme', 199.99),
('Pull en laine col roulé gris', 'pull', 'H&M', 'homme', 29.99),
('Pull en cachemire rose poudré', 'pull', 'Uniqlo', 'femme', 129.99),
('Pull à motifs géométriques', 'pull', 'Zara', 'homme', 39.99),
('Pull en laine à col V', 'pull', 'Mango', 'femme', 59.99),
('Short en jean déchiré', 'short', 'Levi''s', 'homme', 29.99),
('Short en lin beige', 'short', 'H&M', 'femme', 14.99),
('Short en jean taille haute', 'short', 'Zara', 'femme', 19.99),
('Chaussettes hautes en laine', 'chaussettes', 'Falke', 'homme', 14.99),
('Chaussettes en coton coloré', 'chaussettes', 'Happy Socks', 'femme', 9.99),
('Robe en coton imprimé', 'robe', 'Sandro', 'femme', 149.99),
('Costume complet gris', 'costume', 'Hugo Boss', 'homme', 499.99),
('Blazer en laine marine', 'veste', 'Ralph Lauren', 'homme', 349.99),
('Manteau en laine beige', 'manteau', 'Sandro', 'femme', 299.99),
('Parka kaki avec fausse fourrure', 'manteau', 'Zara', 'homme', 129.99),
('Blouson en cuir marron', 'veste', 'The Kooples', 'homme', 399.99);

INSERT INTO accessoires(nom_accessoire, type_accessoire) VALUES
('Ceinture en cuir', 'Ceinture'),
('Bretelles fines', 'Bretelles'),
('Bretelles larges', 'Bretelles'),
('Cravate slim', 'Cravate'),
('Cravate classique', 'Cravate'),
('Nœud papillon', 'Nœud papillon'),
('Pochette de costume', 'Pochette');

INSERT INTO tailles(taille) VALUES
('XS'),
('S'),
('M'),
('L'),
('XL'),
('XXL');

INSERT INTO dispo_tailles(id_produit, id_taille, quantite) VALUES
(1, 1, 10),
(1, 6, 5);

INSERT INTO dispo_tailles(id_produit, id_taille, quantite) VALUES
(2, 4, 35),
(2, 5, 20),
(2, 6, 15);

INSERT INTO dispo_tailles(id_produit, id_taille, quantite) VALUES
(6, 2, 10),
(6, 3, 12),
(6, 4, 14),
(6, 5, 16);

INSERT INTO dispo_tailles(id_produit, id_taille, quantite) VALUES
(12, 1, 15),
(12, 3, 25),
(12, 5, 15),
(12, 6, 10);

INSERT INTO produits_accessoires (id_produit, id_accessoire) VALUES (1, 1);
INSERT INTO produits_accessoires (id_produit, id_accessoire) VALUES (2, 4);
INSERT INTO produits_accessoires (id_produit, id_accessoire) VALUES (3, 5);
INSERT INTO produits_accessoires (id_produit, id_accessoire) VALUES (4, 6);


INSERT INTO gerants(login,mdp) VALUES('admin',sha256('admin'));