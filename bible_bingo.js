/**
 * Make Bible Bingo Cards
 * Plays game by calling what's in boxes based on playing cards (array)
 */

var start_btn = document.getElementById("start_btn");
var play_game = document.getElementById("calls");
var cards_num = document.getElementById("players");

var objects = [];
var scripture1 = {}, scripture2 = {}, scripture3 = {}, scripture4 = {}, scripture5 = {};
objects.push(scripture1, scripture2, scripture3, scripture4, scripture5);

var books = [], chMax = []; 
//biblical symbols
var symbols = ["\u{1f607}","\u{1f64f}","\u{1f47c}","\u{1f54a}", "\u{1f35e}", "\u{1f377}", "\u26ea", "\u{1f31d}", "\u{1f31e}"]; 
var fScpt = [], sScpt = [], tScpt = [], foScpt = [], fiScpt = []; //scripts generated from objects
var first = [], second = [], third = [], fourth = [], fifth = []; //rows
var calls_arr = [], caller = [];
var calls_set = new Set();
var call_count = 0;


function makeCards(){

    var url = "bible.json";
    var btest = null;
    var combined = false;
    var oldT = document.getElementById("old_testament");
    var newT = document.getElementById("new_testament");

    //checkboxes oldtestament and/or newtestament
    if(!oldT.checked && !newT.checked){
        alert("Please choose at least one.");
    }
    else{
        if(oldT.checked && newT.checked){
            url = "bible_combined.json";
            combined = true;
        }
        
        //don't show placeholder anymore
        document.getElementById("placeholder").style.display = "none";

        //get bible info from json
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(){
            if(xhr.readyState === 4 && xhr.status === 200){
                let bible = JSON.parse(xhr.responseText);

                if(combined){
                    btest = bible.bible;
                }
                else{
                    if(oldT.checked){
                        btest = bible.oldTestament;
                    }
                    else if(newT.checked){
                        btest = bible.newTestament;
                    }
                }
                
                //loop through to make the given amount of players their bingo cards
                for(let x = 0; x < cards_num.value; x++){
                    //all to make one bingo card
                    getBooks(btest);
                    setSymbols();
                    compatibility(btest);
                    setForTable();
                    setIndexes();
                }

                shuffleArray(calls_arr);
                for(let call of calls_arr){
                    calls_set.add(call);
                }
                if(calls_set.has("B\u271e")){
                    calls_set.delete("B\u271e");
                }
                //change final set to array easier to iterate through
                caller = Array.from(calls_set);

                document.getElementById("call").innerHTML = caller[call_count];
            }
        };

        xhr.open("GET", url, true);
        xhr.send();   
        
        //hide div that makes cards
        document.getElementById("cards_num").style.display = "none";
        //show print button and note on printing
        document.getElementById("print_btn").style.display = "inline-block";
        document.getElementById("pnote").style.display = "block";
    } 
    
}//makeCards

function shuffleArray(arr){
    //shuffle indices in array
    for(let i = arr.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * i);
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}//shuffleArray

function getBooks(test){
    var temp = [];
    //reset arrays for next making of card
    books = [];
    chapters = [];
    chMax = [];
    fScpt = [], sScpt = [], tScpt = [], foScpt = [], fiScpt = [];
    first = [], second = [], third = [], fourth = [], fifth = [];

    //book id
    for(let id = 0; id < test.length; id++){
        temp.push(id);
    }

    shuffleArray(temp);
    for(let b = 0; b < 5; b++){
        //to only get 5
        books.push(temp[b]);
    }
    //set properties of scripture objects
    for(let o = 0; o < objects.length; o++){
        if(test[books[o]].bookName.length > 7){
            objects[o].bookName = test[books[o]].abrev;
        }
        else
            objects[o].bookName = test[books[o]].bookName;
    }
    //get chapters for each book and sets chapter for each object
    for(let bid = 0; bid < books.length; bid++){
        getChapter(bid, test);
    }
}//getBooks

function getChapter(bid, test){
    //chapter of book
    var cid = Math.floor(Math.random() * test[books[bid]].chapters.length);

    //set chapter for object
    objects[bid].chapter = test[books[bid]].chapters[cid].number;
    getVerses(bid, cid, test);
}//getChapters

function getVerses(bid, cid, test){
    var mVerse = test[books[bid]].chapters[cid].verses;
    var qt = 7;

    //amount of verses (7) and starting verse
    var sVerse = Math.floor(Math.random() * mVerse) + 1; //inclusive
    
    //if close to last verse then make it last 7 verses of chapter
    var diff = mVerse - sVerse;
    if(diff < 6){ 
        //make it the last 7 verses of chapter
        if(mVerse > 7){
            sVerse = mVerse - 6;
        }
        //chapters with less than 7 verses read the whole thing
        else{
            sVerse = 1;
            qt = mVerse - sVerse;
            if(qt == 0){
                qt = mVerse;
            }
        }
    }

    //set verses for object
    objects[bid].startVerse = sVerse;
    
    //sVerses.push(sVerse);
    objects[bid].qtVerse = qt;
    
    //keep at the end for checking
    objects[bid].cMax = test[books[bid]].chapters.length;
    chMax.push(objects[bid].cMax);
    objects[bid].vMax = mVerse;
}//getVerses

function setSymbols(){
    scripture3.symbol = "\u271e"; //cross freebie
    shuffleArray(symbols);

    //get the first 5 symbols in the shuffled array for the 5 objects
    for(let s = 0; s < 4; s++){
        if(s >= 2){
            objects[s+1].symbol = symbols[s];
        }
        else{
            objects[s].symbol = symbols[s];
        }
    }
}//setSymbols

function compatibility(test){
    var cMin = 100;
    var vMin = 100;
    var changed = null;
    
    //find book with smaller amount of chapters
    for(let m = 0; m < chMax.length; m++){
        if(chMax[m] < cMin){ cMin = chMax[m]; } 
    }

    //first change chapters to be within the minimum
    changed = checkChapters(test, cMin);
    
    //then check and/or change the verses accordingly with all objects
    for(let obj of objects){
        if(changed){
            var cid = obj.chapter - 1;
            var bid = findBook(obj.bookName, test);
            obj.vMax = test[bid].chapters[cid].verses;
        }
            
        //find the smallest amount of verses in chapter
        if(obj.vMax < vMin){ vMin = obj.vMax; }
    }
    
    fixVerses(vMin);
}//compatibility

function findBook(book, test){
    let bid = 0;
    for(let b = 0; b < books.length; b++){
        if(book == test[books[b]].bookName || book == test[books[b]].abrev){
            bid = b;
            break;
        }
    }
    return bid;
}//findBook

function checkChapters(test, cMin){
    var newChaps = false;
    for(obj of objects){
        //if chosen chapter of book is within the book with the minimal amount of chapters 
        var ch = obj.chapter;
        if(ch > cMin){
            var cid = Math.floor(Math.random() * cMin);
            var bid = findBook(obj.bookName, test);
            obj.chapter = test[bid].chapters[cid].number;
            newChaps = true;
        }
    }//for
    return newChaps;
}//checkChapter

function fixVerses(vMin){
    for(obj of objects){
        if(obj.startVerse > vMin){
            obj.startVerse = Math.floor(Math.random() * vMin) + 1; 
            //make sure the starting verse is at least 7 verses away from the last verse
            let diff = vMin - obj.startVerse;
            
            if(diff < 6){
                //if the total amount of verses in chapter is more than or equal to 7 verses
                if(vMin >= 7){
                    obj.startVerse -= (6 - diff);
                }
            }
        }
    }//for
}//fixVerses

function setForTable(){
    //only the following is allowed on the card: bookName, chapter, starting verse, verse quantity (mostly 7), symbol
    //first object 
    fScpt.push(objects[0].bookName);
    fScpt.push("c" + objects[0].chapter);
    fScpt.push("v" + objects[0].startVerse);
    fScpt.push(objects[0].qtVerse);
    fScpt.push(objects[0].symbol);

    //second object 
    sScpt.push(objects[1].bookName);
    sScpt.push("c" + objects[1].chapter);
    sScpt.push("v" + objects[1].startVerse);
    sScpt.push(objects[1].qtVerse);
    sScpt.push(objects[1].symbol);

    //third object 
    tScpt.push(objects[2].bookName);
    tScpt.push("c" + objects[2].chapter);
    tScpt.push("v" + objects[2].startVerse);
    tScpt.push(objects[2].qtVerse);
    tScpt.push(objects[2].symbol);

    //fourth object 
    foScpt.push(objects[3].bookName);
    foScpt.push("c" + objects[3].chapter);
    foScpt.push("v" + objects[3].startVerse);
    foScpt.push(objects[3].qtVerse);
    foScpt.push(objects[3].symbol);

    //fifth object 
    fiScpt.push(objects[4].bookName);
    fiScpt.push("c" + objects[4].chapter);
    fiScpt.push("v" + objects[4].startVerse);
    fiScpt.push(objects[4].qtVerse);
    fiScpt.push(objects[4].symbol);
}//setForTable

function setIndexes(){
    //index for each row: 0 = bookName, 1 = chapter, 2 = startingVerse, 3 = verse quantity, 4 = holy symbol
    //for the third row the symbol is the cross which is a freebie
    let fRow = new Set([]);

    //random order of index for first row
    for(let r = 0; r < 5; r++){
        let randNum = Math.floor(Math.random() * 5);
        fRow.add(randNum);

        //if number wasn't added
        while(fRow.size == r){
            randNum = Math.floor(Math.random() * 5);
            fRow.add(randNum);
        }
    }//for

    //change set to array
    first = Array.from(fRow);

    //get the third number of array 
    //if it's 4 (symbol) make array be for the third row 
    if(first[2] == 4){
        third = first;
        first = [];

        orderArrays(fourth, third);
        orderArrays(fifth, fourth);
        orderArrays(first, fifth);
        orderArrays(second, first);
    }
    else if(first[1] == 4){
        orderArrays(third, first);
        orderArrays(fourth, third);
        orderArrays(fifth, fourth);
        orderArrays(second, fifth);
    }
    else{ //4 is not in the middle
        //push numbers in arrays in order
        orderArrays(second, first);

        //4 is in either first or last index
        if(second[1] != 4){ 
            orderArrays(fourth, second);
            if(fourth[1] == 4){
                orderArrays(third, fourth);
                orderArrays(fifth, third);
            }
            else{//if 4 in 4th row is in first index
                orderArrays(fifth, fourth);
                orderArrays(third, fifth);
            }
        }
        else{ //if 4 is in index 0 in the first row
            orderArrays(third, second);
            orderArrays(fourth, third);
            orderArrays(fifth, fourth);
        }
    }

    fillInRows();
}//setIndexes

function orderArrays(next, prev){
    next.push(prev[4]);
    next.push(prev[0]);
    next.push(prev[1]);
    next.push(prev[2]);
    next.push(prev[3]);
}//orderArrays

function fillInRows(){
    let temp = 0;
    //set rows in order of index
    for(let i = 0; i < 5; i++){
        //first row
        temp = first[i];
        first[i] = fScpt[temp];

        //second row
        temp = second[i];
        second[i] = sScpt[temp];

        //third row
        temp = third[i];
        third[i] = tScpt[temp];

        //fourth row
        temp = fourth[i];
        fourth[i] = foScpt[temp];

        //fifth row
        temp = fifth[i];
        fifth[i] = fiScpt[temp];
    }//for

    bingoCard();
}//fillInRows

function bingoCard(){
    var bTable = document.createElement("table");
    bTable.setAttribute("class", "bingo_cards");

    var theader = ['B','I','B','L','E'];

    for(let i = 0; i < 6; i++){
        var tr = document.createElement("tr");
        tr.setAttribute("class", "bc");
        var arr = [];
        //which array to fill in
        switch(i){
            case 0:
                arr = theader;
                break;
            case 1:
                arr = first;
                break;
            case 2:
                arr = second;
                break;
            case 3:
                arr = third;
                break;
            case 4:
                arr = fourth;
                break;
            case 5:
                arr = fifth;
                break;
        }//switch
        //inside table row
        for(let d = 0; d < 5; d++){
            //table headers and table data
            if(i == 0){
                let th = document.createElement("th");
                //remove borders for headers
                th.style.border = "none";
                th.innerHTML = arr[d];
                tr.appendChild(th);
            }//if - th
            else{
                let td = document.createElement("td");

                if(typeof arr[d] == "string"){
                    if(arr[d].charAt(0) == "c" || arr[d].charAt(0) == "v"){
                        //console.log(arr[d]);
                        td.innerHTML = arr[d].substr(1);
    
                        //styling text to distinct chapter from starting verse
                        td.style.fontWeight = "bold";
                        
                        if(arr[d][0] == "v"){
                            td.style.fontStyle = "italic";
                        }
                        //console.log(td);
                    }
                    else{
                        td.innerHTML = arr[d];
                        if(arr[d] == '\u271e'){
                            td.setAttribute("class", "cross");
                        }
                    }
                }
                else{
                    td.innerHTML = arr[d];
                }
                
                tr.appendChild(td);
            }//else - td
            
        }//inner for
        bTable.appendChild(tr);
    }//for
    document.getElementById("cards").appendChild(bTable);
    
    addCalls(theader, bTable);
}//bingoCard

function addCalls(harr, table){
    //add all calls to an array
    var call = "";
    for(var i = 1; i < 6; i++){
        var row = table.rows[i];
        for(var d = 0; d < 5; d++){
            let data = row.cells[d].textContent;
            //don't add BCross since that is a freebie not a call
            if(data != "B\u271e"){
                call = harr[d] + data;
                calls_arr.push(call);
            }
        }
    }
}//addCalls

function printCards(){
    //opens new window to print
    var newWin = window.open('', 'PRINT', 'height=800,width=900');
    newWin.document.write('<html><head>');
    newWin.document.write('<meta charset="utf-8"/>');
    newWin.document.write('<meta name="viewport" content="width=device-width, initial-scale=1.0">'); 
    newWin.document.write('<link rel="stylesheet" type="text/css" href="style_print.css">');
    newWin.document.write('</head><body>');
    //add each table in the new window   
    for(let p = 1; p <= cards_num.value; p++){
        var table = document.getElementById("cards").children[p];
        var cloneTable = table.cloneNode(true);
        newWin.document.write(cloneTable.outerHTML);
        newWin.document.write('<ul><li>&#x1f607;-Smiling face with halo &#x1f64f;-Folded Hands &#x1f47c;-Baby Angel &#x1f54a;-Dove &#x1f35e;-Bread</li>');
        newWin.document.write('<li>&#x1f377;-Wine Glass &#x26ea;-Church &#x1f31d;-Full Moon Face &#x1f31e;-Sun with Face</li>');
        newWin.document.write('<li>For each row and column: {book name}{<b>chapter number</b>}:{<b><i>starting verse number</i></b>} {the number of verses}</li></ul>');
    }
    newWin.document.write('</body></html>');
    
    //ready for game to start
    start_btn.disabled = false;
}//printCards

function startGame(){
    //hide button
    start_btn.style.display = "none";
    //show calls div
    play_game.style.display = "block";
}//startGame

function nextCall(){
    //place the previous call in box
    let p = document.createElement("p");
    p.innerHTML = caller[call_count];
    document.getElementById("prev_calls").appendChild(p);

    call_count++;
    if(call_count == calls_set.size){
        document.getElementById("next_btn").innerHTML = "DONE";
        document.getElementById("next_btn").disabled = true;
    }
    else
        document.getElementById("call").innerHTML = caller[call_count];
}//nextCall

