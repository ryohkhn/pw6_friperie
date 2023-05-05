INSERT INTO produits(nom_produit, type_produit, marque, genre, prix) VALUES
('Jean slim bleu', 'pantalons', 'Levi''s', 'homme', 19.99),
('Jean boyfriend délavé', 'pantalons', 'Zara', 'femme', 14.99),
('Chino beige', 'pantalons', 'Gap', 'homme', 24.99),
('Pantalon taille haute noir', 'pantalons', 'H&M', 'femme', 29.99),
('Chemise en lin blanc', 'chemises', 'Uniqlo', 'homme', 39.99),
('Chemise en jean bleu', 'chemises', 'Levi''s', 'femme', 49.99),
('Chemise à rayures fines', 'chemises', 'Ralph Lauren', 'homme', 79.99),
('Chemisier en soie noir', 'chemises', 'Sandro', 'femme', 129.99),
('Veste en laine camel', 'vestes', 'Mango', 'homme', 89.99),
('Veste en cuir noir', 'vestes', 'The Kooples', 'femme', 259.99),
('Veste en jean délavé', 'vestes', 'Zara', 'homme', 49.99),
('Veste en laine bouclée beige', 'vestes', 'Sandro', 'femme', 199.99),
('Pull en laine col roulé gris', 'pulls', 'H&M', 'homme', 29.99),
('Pull en cachemire rose poudré', 'pulls', 'Uniqlo', 'femme', 129.99),
('Pull à motifs géométriques', 'pulls', 'Zara', 'homme', 39.99),
('Pull en laine à col V', 'pulls', 'Mango', 'femme', 59.99),
('Short en jean déchiré', 'shorts', 'Levi''s', 'homme', 29.99),
('Short en lin beige', 'shorts', 'H&M', 'femme', 14.99),
('Short en jean taille haute', 'shorts', 'Zara', 'femme', 19.99),
('Chaussettes hautes en laine', 'chaussettes', 'Falke', 'homme', 14.99),
('Chaussettes en coton coloré', 'chaussettes', 'Happy Socks', 'femme', 9.99),
('Robe en coton imprimé', 'robes', 'Sandro', 'femme', 149.99),
('Costume complet gris', 'costumes', 'Hugo Boss', 'homme', 499.99),
('Blazer en laine marine', 'vestes', 'Ralph Lauren', 'homme', 349.99),
('Manteau en laine beige', 'manteaux', 'Sandro', 'femme', 299.99),
('Parka kaki avec fausse fourrure', 'manteaux', 'Zara', 'homme', 129.99),
('Blouson en cuir marron', 'vestes', 'The Kooples', 'homme', 399.99);

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
INSERT INTO clients(nom,prenom,adresse,login,mdp) VALUES('RODRIGUEZ','Lucas','1 rue des pigeons,75017 Paris','lucasrdz',sha256('lucas'));

DO $$
DECLARE
  id INTEGER;
BEGIN
  INSERT INTO commandes (id_client) VALUES (1) RETURNING id_commande INTO id;
  INSERT INTO produits_commandes (id_produit, id_commande, id_taille, quantite) VALUES (1, id, 1, 1);
  INSERT INTO produits_commandes (id_produit, id_commande, id_taille, quantite) VALUES (2, id, 4, 3);
END $$;