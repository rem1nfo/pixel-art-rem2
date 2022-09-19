// ******** Variables ********
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const fs2 = require('fs').promises;

// Pour envoyer les fichiers .ejs (=html) lors des requetes
var fs = require('fs');
const express = require('express');
app.set('view engine', 'ejs'); // Pour afficher des veiews
app.use(express.static(__dirname + "/public")); //Pour spécifier le chemin des .js et .css


// Variables de jeu : 
var list_of_pixels = []; // Note : au lancement, liste vide qui doit être initialisée à partir du fichier "mémoire" qui enregistre régulièrement la toile. (Important de faire une sauvegarde dans un fichier car si le serveur se coupe, le contenu de la liste définie dans le serveur est perdu)
init_list();



// Fonction d'initialisation de la liste de pixels à partir du fichier de sauvegarde
async function init_list(){
    if(fs.existsSync("./save.json")){
        list_of_pixels = JSON.parse(fs.readFileSync("./save.json").toString());
        console.log(list_of_pixels);
    }
}
// Fonction d'écriture dans le fichier save.json (= sauvegarde la base de données)
function save(){
    try{
        fs.writeFileSync("./save.json", JSON.stringify(list_of_pixels));

    }
    catch(err){
        io.emit("test_debug", function(){});
    }
}






// Lancement du serveur sur le port 3000
http.listen(process.env.PORT || 3000, function(){
    console.log("Server running on port 3000");
})

// En fonction de l'url, on donne une réponse
app.get("*", function(req, res){
    res.render('index', {myCss: 
        {
        style : fs.readFileSync('public/Home.css','utf8')
        }
    });
    res.end();
})



// A chaque connexion de client : 
io.on('connection', function(socket){
    console.log("Un nouvel utilisateur s'est connecté");
    //On envoit au client l'ensemble des pixels déjà existants pour les afficher.
    io.emit('display_all_pixels', {list_of_pixels : list_of_pixels});

    // A chaque deconnexion :
    socket.on('disconnect', function(){
        console.log("Un utilisateur s'est déconnecté");
        console.log("Sauvegarde de la bdd dans le fichier save.json en cours");
        save();
    })

    // A chaque placement de pixel par un user :
    socket.on('add_pixel', function(msg){
        var new_pixel = msg.new_pixel;
        console.log(new_pixel.x, new_pixel.y, new_pixel.color);

        // Si aucun pixel n'a les mêmes coordonnées, on l'ajoute:
        var already_exists = false;
        for(var i = 0; i< list_of_pixels.length; i++){
            if(list_of_pixels[i].x == new_pixel.x && list_of_pixels[i].y == new_pixel.y){
                already_exists = true;
                if(list_of_pixels[i].color != new_pixel.color){
                    list_of_pixels[i].color = new_pixel.color;
                }
            }
        }

        // S'il n'existe pas, on l'ajoute
        if(already_exists == false){
            list_of_pixels.push(new_pixel);
        }



        // Une fois le pixel ajouté, on notifie tous les clients pour qu'ils affichent ce nouveau pixel
        io.emit('display_one_pixel', {new_pixel : new_pixel});

        console.log("Liste des pixels : ");
        console.log(list_of_pixels);

    })
});
