# Projet PW6

### Dépendances

Les modules suivant sont nécessaires:
- `Nodes.js`
    - `express`
    - `ejs`
    - `pg`
    - `cookie-parser`
    - `express-session`

### Configuration

Dans le fichier `src/database_pool.js` se trouve le configuration de la base de données PostregreSQL.  
```js
const client = new Client({
    user: 'postgres', // nom d'utilisateur
    host: 'localhost',
    database: 'pw6', // nom de la base de données
    password: '1234', // mot de passe du compte PostreSQL
    port: 5432, // port de la base de données
});
```

Une fois le fichier configuré, la base de données `PostreSQL` doit être initialisée:
```bash
cd src/database
```
```postgresql
\i init.sql
```

### Éxécution

Lancez le serveur en exécutant la commande `node app.js` dans le dossier `src`.  
Accédez au site en visitant l'URL [http://localhost:8080](http://localhost:8080).

### Membres

| Nom       | Prénom  | Numéro étudiant | Pseudo GitLab |
|:----------|:--------|:----------------|:--------------|
| CAHAGNE   | Marius  | 22004660        | @cahagne      |
| RODRIGUEZ | Lucas   | 22002335        | @rodrigul     |