// ******** Définition des variables importantes ********
console.log("Welcome");

// Variables pour socket avev serveur (app.js)
var socket = io();


// -> colorChoice est la div contenant la palette de couleurs
const colorChoice = document.querySelector('#Colors_choice');
const cursor = document.querySelector("#cursor");

// -> game correspond au canvas
const game = document.querySelector('#game');
const context = game.getContext('2d'); // Pour les pixels 
const grid_context = game.getContext('2d'); // Pour la grille
game.width = 2000; //1200 600
game.height = 2000;


const size_cell = 10; // Taille d'un côté d'une case
const colors_list = ["#4f0011", "#880029", "#b73300", "#b97a00", "#b99b28", "#b7b280", "#01784c", "#019458", "#5bad3f", "#02554f", "#00737b", "#01958d", "#1a3a77", "#2868aa", "#2868aa", "#3aa7b0", "#352a8d", "#4e43b9", "#6980b8", "#5e1676", "#83368b", "#a57bb8", "#a00c5c", "#b8295e", "#b96f7b", "#4e3422", "#724d1c", "#b98352", "#000", "#3b3c3c", "#636567", "#FFF"]; // Toutes les couleurs disponibles
let current_color_choice = "#FFF"; // Code de la couleur sélectionnée


let position_on_screen_X = 0;
let position_on_screen_Y = 0;

let scrollX = 0;
let scrollY = 0;


// ******** Création des div pour couleurs palettte ********
colors_list.forEach(color=>{
    const colorItem = document.createElement('div');
    colorItem.addEventListener('click', function(){
        // 1 : on retire le "check" de la couleur précédente:
        let list_of_children = document.querySelector( "#Colors_choice" ).children;
        Array.prototype.forEach.call(list_of_children, element => {
            element.innerHTML = '';
        });

        // 2 : Mise à jour de la nouvelle couleur + ajout du check
        current_color_choice = color;
        colorItem.innerHTML = '<i class="fa-solid fa-check"></i>';
    });
    colorItem.style.backgroundColor = color;
    colorChoice.appendChild(colorItem);
});



// ******** Tracé du cadrillage ********
function draw_grid(ctx, width, height, cell_size){
    ctx.beginPath();
    ctx.strokeStyle = "#ccc";
    for(let i = 0; i<width; i++){
        ctx.moveTo(i*cell_size, 0);
        ctx.lineTo(i*cell_size, height);
        ctx.moveTo(0, i*cell_size);
        ctx.lineTo(width, i*cell_size);
    }
    ctx.stroke();
}
draw_grid(grid_context, game.width, game.height, size_cell);









// ******** Pose un pixel sur action "click" ********
function add_Pixel(){
    //Coordonnées de la souris
    x = cursor.offsetLeft - game.offsetLeft;
    y = cursor.offsetTop - game.offsetTop;

    context.beginPath()
    context.fillStyle = current_color_choice;
    context.fillRect(x,y,size_cell,size_cell);

    // Création du pixel à envoyer au serveur (=bdd)
    const pixel = {
        x,
        y,
        color: current_color_choice
    }

    console.log("Un pixel a été placé en ("+x+","+y+") de couleur : "+pixel.color);
    // Envoi du pixel au serveur (=le serveur l'ajoutera à la base de données)
    socket.emit('add_pixel', {new_pixel : pixel}); // on pourra récupérer le contenu de "pixel" dans le serveur en appelant new_pixel
    //TODO : Dans le sevreur, remplacer le pixel s'il existe déjà
}


cursor.addEventListener('click', function(){
    add_Pixel();
});
game.addEventListener('click', function(){
    add_Pixel();
})




// ******** Cellule encadrée quand on passe dessus ********
game.addEventListener('mousemove', function(event){
    const cursorLeft = event.clientX - (cursor.offsetWidth/2);
    const cursorTop = event.clientY - (cursor.offsetHeight/2);

    position_on_screen_X = cursorLeft;
    position_on_screen_Y = cursorTop;
    //console.log(cursorLeft+","+cursorTop);

    cursor.style.left = Math.floor((cursorLeft+scrollX)/size_cell) * size_cell + "px";
    cursor.style.top = Math.floor((cursorTop+scrollY)/size_cell) * size_cell + "px";
});








// Mise à jour du niveau de scroll actuel -> les coordonnées de la souris sont : x_screen + niveau de scrollX
window.addEventListener("scroll", (event) => {
    scrollY = this.scrollY;
    scrollX = this.scrollX;
    console.log("scroll en y : "+scrollY+", scroll en x : "+ scrollX);
});





// ******** Mise à jour des pixels placés par les autres joueurs ********
// Ici lors de la connexion, on affiche tous ceux de la base de données
socket.on('display_all_pixels', function(msg){
    var list_of_pixels = msg.list_of_pixels;

    // Affichage de tous les pixels
    for(var i = 0; i<list_of_pixels.length; i++){
        context.beginPath();
        context.fillStyle = list_of_pixels[i].color;
        context.fillRect(list_of_pixels[i].x,list_of_pixels[i].y,size_cell,size_cell);
    }
});


// Ici on affiche les pixels modifiés en temps réel par les autres utilisateurs
socket.on('display_one_pixel', function(msg){
    var new_pixel = msg.new_pixel;
    context.beginPath();
    context.fillStyle = new_pixel.color;
    context.fillRect(new_pixel.x,new_pixel.y,size_cell,size_cell);
});




//test pour deboggage
socket.on('test_debug', function(msg){
    console.log("Problème lors de l'enregistrement dans le fichier")
});
socket.on("is_saving", function(msg){
    console.log("Auto-save");
    console.log("Liste de pixels : "+msg.list_of_pixels);
})