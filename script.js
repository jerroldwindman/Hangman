/*
An array of letters used for randomly choosing letters of the alphabet for the 
AJAX call to the DataMuse API
*/
var alphabet = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z"
];

//Whenever a key is pressed during gameplay, the guess function will fire
document.addEventListener("keydown", guess);

//The necessary window changes that need to be made after the start button has been clicked
document.querySelector("#start").addEventListener("click", function() {
    document.querySelector("#introText").style.display = "none";
    document.querySelector("#start").style.display = "none";
    document.querySelector("#difficultyText").style.display = "block";
    document.querySelector("#options").style.display = "block";
    document.querySelector("#game").style.backgroundColor = "white";
});

//The difficulty buttons will call the first function for setting up
//and making the API call
var options = document.querySelectorAll(".option");
for (let i = 0; i < 3; i++) {
    options[i].addEventListener("click", findWord);
}

//After the game has ended, certain data stores have to be cleared and
//we have to bring gameplay back the choice of difficulty modal
document.querySelector("#playAgain").addEventListener("click", function() {
    clearGame();
    document.querySelector("#gameover").style.display = "none";
    document.querySelector("#difficultyText").style.display = "block";
    document.querySelector("#options").style.display = "block";
    document.querySelector("#game").style.backgroundColor = "white";
});

/*
This function will first hide the body parts of the stick figure so they are ready
to be displayed when wrong guesses are made

Then the function will take the data-min and data-max attributes of the clicked
option element, which represent the minimum number of letters for the difficulty
chosen and the maximum number of letters for the difficulty chosen. These values
are then stored in the 'options' div

Finally the accessDataMuse function is called with the minimum number of letters,
the maximum number of letters, and the success callback function to be passed into the 
AJAX call
*/
function findWord(event) {
    document.querySelector("#introModal").style.display = "none";
    let human = document.querySelector("#human");
    let bodyParts = human.children;

    for (let i = 0; i < bodyParts.length; i++) {
        bodyParts[i].style.display = "none";
    }
    var min = parseInt(event.target.dataset.min);
    var max = parseInt(event.target.dataset.max);
    document.querySelector("#options").setAttribute("min", min);
    document.querySelector("#options").setAttribute("max", max);

    accessDataMuse(min, max, analyzeResults);
}

/*
First, this function will randomly choose a first and last letter from the alphabet array
defined in the beginning of the document. Then a random number between the minimum number
of possible letters and the maximum number of possible letters is chosen.

The API call is made and whether or not the results are valid will determine what happens next.
The callback function on the success of the API call is analyzeResults

If no word was found after analyzing the results of the API call, or there are characters within
the word that are not appropriate for a hangman game (spaces or hyphens, which sometimes come up in
the results of querying the DataMuse API) then the function is called recursively and the API is queried
again using a different set of random first and last letters. This function will recursively call
itself until a valid word is found and we then call the setUpWord function
*/
function accessDataMuse(min, max, callback) {
    var result = "";

    //Choose random first and last letter
    var firstLetter = alphabet[Math.floor(Math.random() * Math.floor(26))];
    var lastLetter = alphabet[Math.floor(Math.random() * Math.floor(26))];

    //Signature needed to be appended to the path in order to make API call
    var signature = `&k=jerroldwindman`;
    var numberOfLetters = Math.floor(Math.random() * (max - min)) + min;
    var numberOfQMarks = numberOfLetters - 2;
    var qMarks = `?`.repeat(numberOfQMarks);
    var URL = `https://api.datamuse.com/words?sp=${firstLetter}${qMarks}${lastLetter}${signature}`;
    $.get(URL, callback).then(function() {
        if (
            document.querySelector("#uLineBox").getAttribute("answer") === "" ||
            typeof document.querySelector("#uLineBox").getAttribute("answer") ==
                "undefined" || document.querySelector("#uLineBox").getAttribute("answer") ==
                null
        ) {
            accessDataMuse(min, max, analyzeResults);
        } else if (
            document
                .querySelector("#uLineBox")
                .getAttribute("answer")
                .includes("-") ||
            document
                .querySelector("#uLineBox")
                .getAttribute("answer")
                .includes(" ")
        ) {
            accessDataMuse(min, max, analyzeResults);
        } else {
            setUpWord();
        }
    });
}
/*
This function goes through the results of the API call and determines
a suitable word to be used for the game if one was found in the results.

The result of the API call is an array of objects each with two properties,
a word and a score. The score for the word "has no interpretable meaning, other 
than as a way to rank the results" but the words with scores lower than 500 were found
to be unsuitable for the purposes of having an enjoyable user experience. 

Therefore, the initial results that matched the API call are cut down to only the 
words with scores higher than 500, and a random word from that subset is chosen for the game.

If no words were found using the API call (think for example trying to find a 11 letter word beginning
with x and ending with z), then the function exits without ever storing a word in the uLineBox element
which holds the underlines for the answer letters. This same path is taken if none of the words found have
scores over 500.
*/
function analyzeResults(data) {
    var realWords = [];
    if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
            if (data[i].score < 500) {
                realWords = data.slice(0, i);
                break;
            }
        }
        if (realWords.length > 0) {
            result = realWords[Math.floor(Math.random() * realWords.length)];
            document
                .querySelector("#uLineBox")
                .setAttribute("answer", result.word);
        }
    }
}

/*
The setUpWord function creates a uLine div for each letter of the word
and appends them to the uLineBox div
*/
function setUpWord() {
    let answerBox = document.querySelector("#uLineBox");
    let answer = answerBox.getAttribute("answer");
    for (let i = 0; i < answer.length; i++) {
        let x = document.createElement("div");

        let y = document.createAttribute("class");
        y.value = "uLine";
        x.setAttributeNode(y);
        answerBox.appendChild(x);
    }
}

/*
The guess function fires everytime a key is pressed and will first validate
that the key pressed was that of a letter and, and then it checks whether that
letter occurs in the answer word

The function that is called at the end of the guess function depends on whether
the player made a correct or incorrect guess
*/

function guess(event) {
    if (document.querySelector("#introModal").style.display != "") {
        let guess = event.keycode || event.which;
        let answer = document.querySelector("#uLineBox").getAttribute("answer");

        guess -= 65;
        if (guess >= 0 && guess <= 25) {
            guess = alphabet[guess];
            if (answer.includes(guess)) {
                correctGuess(guess);
            } else {
                incorrectGuess(guess);
            }
        }
    }
}

/*
The correctGuess function uses the indicesOf function to determine at 
which indices the correctly guessed letter occurs in the answer word, and then
uses those locations to fill the corresponding uLine divs in the uLineBox with the
correctly guessed letter. Then it checks if the word has been completely guessed,
in which case the endingSequence function is called with the value of true.
*/
function correctGuess(letter) {
    let answerBox = document.querySelector("#uLineBox");
    let answer = answerBox.getAttribute("answer");
    let spaces = answerBox.children;
    let indexArray = indicesOf(answer, letter);
    for (let i = 0, j = 0; i < indexArray.length && j < spaces.length; j++) {
        if (indexArray[i] == j) {
            spaces[j].innerHTML = letter.toUpperCase();
            i++;
        }
    }
    let progress = "";

    for (let i = 0; i < spaces.length; i++) {
        progress += spaces[i].innerHTML;
    }
    if (answer == progress.toLowerCase()) {
        endingSequence(true);
    }
}

/*
The incorrectGuess function use the incorrectly guessed letter and
checks if it is already being displayed in the incorrect guess box.
If it has not already been guessed, then the function will cycle through
the body parts of the hangman animation until it finds a body part that is
being displayed and then displays it on the screen. A check is performed to 
see if this is the last body part to be displayed in which case the
endingSequence function is called with the value of false
*/
function incorrectGuess(letter) {
    let letterBox = document.querySelector("#wrongLetterBox");
    let bodyParts = document.querySelector("#human").children;
    if (!letterBox.innerHTML.includes(letter.toUpperCase())) {
        letterBox.innerHTML += ` ${letter.toUpperCase()} `;
        for (let i = 0; i < bodyParts.length; i++) {
            if (bodyParts[i].style.display == "none") {
                bodyParts[i].style.display = "block";
                break;
            } else if (i == bodyParts.length - 2) {
                endingSequence(false);
            }
        }
    }
}
/*
The indicesOf function takes in the correctly guessed letter
and the answer word and returns an array containing the indices
at which that letter occurs in the word.
*/
function indicesOf(word, letter) {
    let indexArray = [];
    for (let i = 0; i < word.length; i++) {
        if (word.charAt(i) == letter) {
            indexArray.push(i);
        }
    }
    return indexArray;
}

/*
The endingSequence function takes a boolean value for whether or
not the player figured out the word before the hangman was completely
drawn. The word is displayed regardless and the player is asked if they would
like the play again
*/
function endingSequence(result) {
    document.querySelector("#difficultyText").style.display = "none";
    document.querySelector("#options").style.display = "none";
    let answer = document.querySelector("#uLineBox").getAttribute("answer");
    document.querySelector("#endWord").innerHTML = answer;
    document.querySelector("#introModal").style.display = "";
    document.querySelector("#gameover").style.display = "block";

    document.querySelector("#game").style.backgroundColor =
        "rgba(0, 0, 0, 0.8)";

    if (result) {
        document.querySelector("#result").innerHTML = `won!`;
    } else {
        document.querySelector("#result").innerHTML = `lost!`;
    }
}

/*
The clearGame function removes the uLine boxes from the uLineBox,
clears the answer from the uLineBox data-answer attribute and clears
the incorrect guess box
*/
function clearGame() {
    let answerBox = document.querySelector("#uLineBox");
    let answer = answerBox.getAttribute("answer");
    for (let i = 0; i < answer.length; i++) {
        answerBox.removeChild(answerBox.childNodes[0]);
    }
    answerBox.setAttribute("answer", "");

    document.querySelector("#wrongLetterBox").innerHTML = "";
}
