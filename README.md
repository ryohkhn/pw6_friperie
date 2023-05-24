# Projet PW6

# Le Grenier de Mamie - Site de Friperie Solidaire

Le Grenier de Mamie est un projet de site de friperie solidaire permettant aux utilisateurs de trouver et d'acheter des vêtements bon marché. Le site propose une variété de produits, tels que des pantalons, des chemises, des vestes etc..

L'objectif principal de ce projet est de fournir aux utilisateurs une plateforme facile d'utilisation et accessible pour explorer et acheter des vêtements. De plus, le site offre des combinaisons pré-définies de produits, offrant aux clients une expérience de magasinage simplifiée.

## Fonctionnalités du site

- Consultation des produits : Les utilisateurs peuvent parcourir les différentes catégories de vêtements disponibles sur le site, tels que les pantalons, les chemises, les vestes, ainsi que d'autres articles de friperie. 

- Ajout au panier : Chaque produit ou combinaison a sa propre page, et l'utilisateur peut ajouter des produits à son panier, choisir la taille et si possible les accessoires associés. Le prix du panier courant est affiché à chaque instant.

- Gestion du panier : Les utilisateurs peuvent visualiser le contenu actuel de leur panier, supprimer des articles et revenir à la liste des produits pour continuer leurs achats. Ils peuvent également finaliser leur commande en remplissant un formulaire avec leurs coordonnées de livraison.

- Connexion du gérant : Le gérant du site peut se connecter à une interface spécifique pour gérer les stocks. Il a la possibilité de modifier les quantités en stock et de supprimer les commandes traitées.

- Connexion des clients : Les clients ont la possibilité de s'inscrire au site, ce qui leur permettra de ne pas avoir à toujours remplir le formulaire de paiement. Ils pourront tout de même modifier leurs informations si ils le souhaitent.

## Technologies utilisées

Le site est implémenté en utilisant les technologies suivantes :

- Bootstrap : pour la mise en page et le design réactif du site.
- jQuery : pour la gestion des interactions côté client.
- CSS : pour personnaliser le style et l'apparence du site.
- Node.js : pour le développement du serveur.
- Express.js et EJS : pour la gestion des routes et des vues du site.
- PostgreSQL : pour la gestion de la base de données contenant les informations sur les vêtements, les commandes des clients, etc.

## Configuration de la Base de Données

Avant de commencer à utiliser le site, vous devez configurer votre base de données PostgreSQL. Suivez les étapes ci-dessous pour effectuer la configuration :

1. Assurez-vous d'avoir PostgreSQL installé sur votre machine. Si vous ne l'avez pas encore installé, vous pouvez le télécharger à partir du site officiel de PostgreSQL (https://www.postgresql.org/).

2. Ouvrez le fichier database_pool.js situé à la racine du projet.

3. Copiez le fichier database_pool.js dans un nouveau fichier : database_pool.local.js, et modifiez les valeurs des propriétés user, host, database, password et port en fonction de votre configuration PostgreSQL.

4. Une fois les modifications effectuées, enregistrez le fichier.

5. Créez la base PW6 puis entrez la commande : `\i database/init.sql` dans le dossier `src`.

6. Votre base de données PostgreSQL est maintenant correctement configurée pour fonctionner avec le site.

## Installation et déploiement

1. Assurez-vous d'avoir Node.js et PostgreSQL installés sur votre machine.

2. Clonez ce dépôt et accédez au répertoire du projet.

3. Configurez la base de données avec les étapes décrites ci-dessus.

4. Installez les dépendances en exécutant les commandes `npm install`, `npm install express-session`, `npm install cookie-parser`.

5. Lancez le serveur en exécutant la commande `node app.js` dans le dossier `src`.

6. Accédez au site en ouvrant votre navigateur et en visitant l'URL [http://localhost:8080](http://localhost:8080).

## Membres :

*  Lucas RODRIGUEZ

*  Marius CAHAGNE

