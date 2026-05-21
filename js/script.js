var bsod;
function keyPressHandler(event){
    if (event.keyCode === 77){
        bsod.remove();
        document.getElementById("everything").style.display="flex";
    }
}

async function cursor_blink(element){
    let blinkcursor = document.createElement('p');
    blinkcursor.id = 'blinkcursor';
    blinkcursor.innerHTML = '_';
    element.appendChild(blinkcursor);
    blinkcursor.classList.add('blink');

    setInterval(() => {
        blinkcursor.classList.toggle('blink');
    },300);

}

function randomHexa (num) {
    let n = ['1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'];
    let hex='';let a;
    for (let i=0;i<num;i++){
        a=parseInt(Math.random()*15);
        hex+=n[a];
    }
    return hex;
}

function screenofdeath (){
    document.getElementById("everything").style.display="none";
    bsod = document.createElement('div');
    bsod.id = 'bsod';
    document.getElementById('body1').appendChild(bsod);
    bsod.innerHTML='<span style="font-size:60px;"> :( </span> <br><br>  A fatal exception has occured at '+ randomHexa(4)+':'+randomHexa(8)+'. The current application will be terminated. <br> You lost all your unsaved data ! <br> Press any key to continue'
    setTimeout(() => {
        cursor_blink(document.getElementById("bsod"));
    },0);
    document.body.addEventListener("keydown",keyPressHandler);  
}    
    
    
const images = [
            'media/images/gallery/cat.jpg',
            'media/images/gallery/cat2.jpg',
            'media/images/gallery/catsword.jpg',
            'media/images/gallery/dog.jpg',
            'media/images/gallery/gamer.png',
            'media/images/gallery/sigmacat.jpg',
        ];

let currentIndex = 0;
const currentImageElement = document.getElementById('currentImage');

// Function to update the image source
const updateImage = () => {
    currentImageElement.src = images[currentIndex];
    console.log("Current Image Index: " + currentIndex);
};

// Function to go to the previous image
function goprevious() {
    currentIndex = (currentIndex === 0) ? images.length - 1 : currentIndex - 1;
    updateImage();
}

// Function to go to the next image
function gonext() {
    currentIndex = (currentIndex === images.length - 1) ? 0 : currentIndex + 1;
    updateImage();
}

// Initialize the first image
updateImage();

