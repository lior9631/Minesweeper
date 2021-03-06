'use strict';

/*MODEL*/
//Board game { minesAroundCount: number , isShown: boolean, isMine: boolean, isMarked:  boolean}
var gBoard;
/* This is an object by which the board size is set (in this case: 4*4), and how many mines to put */
var gLevel = { SIZE: 4, MINES: 4 };
var gMinesCount;

/* This is an object in which you can keep and update the current game state: 
 *   isOn â boolean, when true we let the user play 
 *   shownCount: how many cells are shown 
 *   markedCount: how many cells are marked (with a flag)
 *   secsPassed: how many seconds passed */
var gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0 };

/*DOM*/
const MINE = 'ð£'
const MARK = 'ð©'
const EMPTY = ''
const CROSS = 'â'
const V = 'âï¸'
const BOOM = 'ð¥'

const SIMILE = 'ð'
const SAD = 'â¹ï¸'
const SUNGLASSES = 'ð'


/*GLOBAL VARIABLES*/
var gIsFirstClick;//After the first click on the board will be false
var gHintsCount;//Counter of hints
var gStartTime;//Start game time
var gBestTime;
var gCurrTime;
var gIntervalTimer;//For timer
var gStartLoc;//Location of game start
var isBtnHintClicked;//If the player clicked on hint button
var gMinesLeft;//For "DOM" show how many mines left
var gLifeCount;//Life counter
var gSafeUseCount;
var gIsSafeModOn;
var gSafeCell;
var gFindCellsCount;
var gIsManuallyModOn;
var gIsStartGameClicked

//Massages for box-massage
const messBeginGame = 'Find all the mines!'
const messFailed = 'ð¥BOOM! BOOM! You failed the mission!!ð¥'
const messVictor = 'Well done, You neutralized all the bombs'
const messBestTime = ' IN THE BEST TIME'
const messUseHint = 'Click any cell in the board-game to use in the hint'
const messNoSafe = 'No more safe cells'
const messUsedAllSafe = 'You used all the safe cells'
const messManuallyMode = 'Place mines on the board by clicking on cells board, and then click the "START GAME" button to start playing'

/*function*/
//called when page loads
function initGame() {
    gGame.isOn = true//If this is "false" the board is locked
    gIsFirstClick = true
    isBtnHintClicked = false
    gIsSafeModOn = false
    gIsManuallyModOn = false
    gIsStartGameClicked = false

    gGame.shownCount = 0
    gGame.markedCount = 0
    gHintsCount = 3
    gLifeCount = 3
    gSafeUseCount = 3
    gFindCellsCount = 0

    gBestTime = getBestTime()
    gBoard = buildBoard()

    //Update the DOM
    renderBoard(gBoard)

    document.querySelector('.mines').innerHTML = gLevel.MINES
    document.querySelector('.time-watch').innerText = milToFormatTime(0)
    lifeRender()
    hintsRender()
    renderBestTime(gBestTime)

    renderElement('btn-reset', SIMILE)//Render 'Reset' Button (smile face)
    renderElement('count-safe', gSafeUseCount)//Render 'Safe-Mod' button
    renderElement('btn-manually', 'Manually Mod')//Render 'Manually-Mod' button
    disabledUnableHints(true)//disable the hints
    restMineCount()
    boxMessage(messBeginGame)

    //Reset buttons
    document.querySelector('.btn-manually').classList.remove('btn-hide')//shoe button
    document.querySelector('.box-safe').classList.add('btn-hide')//hide button
    document.querySelector('.btn-undo').classList.add('btn-hide')//hide button
}

//Builds the board Set mines at random locations Call setMinesNegsCount() Return the created board
function buildBoard() {
    var board = []
    for (var i = 0; i < gLevel.SIZE; i++) {
        board.push([])
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
            board[i].push(cell)
        }//END FOR
    }//END FOR

    return board
}//END FUNCTION - buildBoard

//Count mines around each cell and set the cell's minesAroundCount.
function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        var row = board[i]
        for (var j = 0; j < row.length; j++) {
            if (row[j].isMine) continue
            var pos = { i, j }
            row[j].minesAroundCount = getMinesAroundCount(pos, board)
        }
    }
}
function getMinesAroundCount(pos, board) {
    var minesCount = 0
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j >= board.length) continue
            if (j === pos.j && i === pos.i) continue
            var cell = board[i][j]
            if (cell.isMine) minesCount++
        }
    }
    return minesCount
}

//Render the board as a <table> to the page
function renderBoard(board) {
    var elBoard = document.querySelector('.board-game')
    var strHTML = ''

    for (var i = 0; i < board.length; i++) {
        strHTML += `<tr>\n`
        var row = board[i]
        for (var j = 0; j < row.length; j++) {
            var cell = board[i][j]
            var nameClass = 'class="cell-' + i + '-' + j + '"'

            strHTML += `\t<td ${nameClass}  onclick="cellClicked(this, ${i}, ${j})"  oncontextmenu="cellMarked(this,${i}, ${j}, event)">`

            if (cell.isMarked && cell.isShown) {
                if (!cell.isMine) {
                    strHTML += CROSS
                } else strHTML += MINE
            } else if (cell.isMine && cell.isShown) {
                strHTML += MINE
            } else if (cell.minesAroundCount > 0 && cell.isShown) {
                strHTML += cell.minesAroundCount
            }
            strHTML += '</td>\n'
        }
        strHTML += '</tr>\n'
    }
    elBoard.innerHTML = strHTML
}

//Called when a cell (td) is clicked
function cellClicked(elCell, iLoc, jLoc) {
    if (!gGame.isOn) return

    var cell = gBoard[iLoc][jLoc]
    if (gIsStartGameClicked && cell.isShown) return


    if (gIsFirstClick) {
        if (gIsManuallyModOn && !gIsStartGameClicked) {
            putsManuallyMine(iLoc, jLoc, elCell)
        } else {
            gStartLoc = { i: iLoc, j: jLoc }
            startGame()
            boxMessage(messBeginGame)
        }
    } if (isBtnHintClicked) {
        useHint(iLoc, jLoc)
        isBtnHintClicked = false
        boxMessage(messBeginGame)
    } else if (cell.isMine && !gIsManuallyModOn) {
        if (cell.isShown) return
        if (gMinesLeft > 0) {
            gMinesLeft--
            document.querySelector(".mines").innerHTML = gMinesLeft
        }
        gLifeCount--
        lifeRender()
        showLivesSupport()

        openCell(gBoard, iLoc, jLoc)
        renderCell(iLoc, jLoc, MINE)
        if (!gLifeCount) {
            renderCell(iLoc, jLoc, BOOM)
            lose()
        } else if (checkGameOver()) {
            updateBestTime()
            victory()
        }
    } else if (!gIsManuallyModOn) {
        expandShown(gBoard, elCell, iLoc, jLoc)
        if (checkGameOver()) {
            victory()
        }
    }
    if (gIsSafeModOn) {
        gIsSafeModOn = false
        gSafeCell.classList.toggle('safe-cell')
    }
    else if (gFindCellsCount === 3) {
        showHideElement('box-safe')
        gFindCellsCount++
    }
}

/* Called on right click to mark a cell (suspected to be a mine) 
Search the web(and implement) how to hide the context menu on right click */
function cellMarked(elCell, iLoc, jLoc, e) {
    e.preventDefault()//Cancel context-menu 
    if (gIsFirstClick || !gGame.isOn) return

    var cell = gBoard[iLoc][jLoc]
    if (cell.isShown) return

    if (cell.isMarked) {
        if (gBoard[iLoc][jLoc].isMine) {
            gGame.markedCount--
        }
        gMinesLeft++
        elCell.innerText = EMPTY
    } else {
        if (!gMinesLeft) return

        if (gBoard[iLoc][jLoc].isMine) gGame.markedCount++
        elCell.innerText = MARK
        gMinesLeft--
    }
    gBoard[iLoc][jLoc].isMarked = !gBoard[iLoc][jLoc].isMarked

    //Update the counter mines left at the DOM
    document.querySelector('.mines').innerHTML = gMinesLeft

    //Checks if have victory
    if (checkGameOver()) {
        victory()
    }
}

//Game ends when all mines are marked and all the other cells are shown
function checkGameOver() {
    var cellsBoardCount = gLevel.SIZE ** 2
    return (gGame.shownCount + gGame.markedCount === cellsBoardCount)
}

function gameOver(mess, btnResFace) {
    boxMessage(mess)
    renderElement('btn-reset', btnResFace)//Render 'Reset' Button

    gGame.isOn = false
    clearInterval(gIntervalTimer)

    document.querySelector('.box-safe').classList.add('btn-hide')//hide button
    document.querySelector('.btn-undo').classList.add('btn-hide')//hide button
}

/**When user clicks a cell with no mines around, we need to open not only that cell, but also its neighbors.
 * NOTE: start with a basic implementation that only opens the non - mine 1st degree neighbors 
 * BONUS: if you have the time later, try to work more like the real algorithm
 * (see description at the Bonuses section below) */
function expandShown(board, elCell, i, j) {
    var cell = board[i][j]
    if (cell.isShown || cell.isMine || cell.isMarked) return

    openCell(board, i, j)

    if (gFindCellsCount < 3) gFindCellsCount++

    if (cell.minesAroundCount > 0) return

    for (var iDiff = i - 1; iDiff <= i + 1; iDiff++) {
        if (iDiff < 0 || iDiff >= board.length) continue

        for (var jDiff = j - 1; jDiff <= j + 1; jDiff++) {

            if (jDiff < 0 || jDiff >= board[iDiff].length) continue
            if (iDiff === i && jDiff === j) continue

            var elCurrCell = getElCellByPos({ i: iDiff, j: jDiff })
            expandShown(board, elCurrCell, iDiff, jDiff)
        }//END FOR
    }//END FOR
}//END function "expandShown"

function setRandomMines(board) {
    var emptyPlaces = getEmptyPlaces(board)
    for (var count = 0; count < gLevel.MINES; count++) {
        var idx = getRandomInteger(0, emptyPlaces.length - 1)

        var place = emptyPlaces.splice(idx, 1)
        place = place[0]
        board[place.i][place.j].isMine = true
    }
}

function startGame() {
    gIsFirstClick = false
    if (!gIsManuallyModOn) {
        showHideElement('btn-manually')
        setRandomMines(gBoard)
    } else gIsManuallyModOn = false

    setMinesNegsCount(gBoard)
    gStartTime = Date.now()
    gIntervalTimer = setInterval(stopWatch, 1000)
    disabledUnableHints(false)//disable the hints
    gMinesLeft = gLevel.MINES
}


function stopWatch() {
    gCurrTime = Date.now();//update the end time
    var elTimeWatch = document.querySelector('.time-watch')
    elTimeWatch.innerHTML = milToFormatTime(gCurrTime - gStartTime)//show the current 
}


/*Hint functions */
function useHint(i, j) {
    var cellsOfHints = getAndShowHints(i, j)
    gGame.isOn = false//Lock the board-The game is paused

    setTimeout(function () {
        hideHints(cellsOfHints)
        gGame.isOn = true
    }, 1000)
}
function getAndShowHints(i, j) {
    gHintsCount--
    //Update Hint panel(DOM)
    hintsRender()
    if (!gHintsCount) disabledUnableHints(true)//disable the hints

    var cellsOfHints = []
    for (var iDiff = i - 1; iDiff <= i + 1; iDiff++) {
        if (iDiff < 0 || iDiff >= gBoard.length) continue
        for (var jDiff = j - 1; jDiff <= j + 1; jDiff++) {
            if (jDiff < 0 || jDiff >= gBoard[iDiff].length) continue

            var currCell = gBoard[iDiff][jDiff]
            if (currCell.isShown || currCell.isMarked) continue

            var pos = { i: iDiff, j: jDiff }
            var elCurrCell = getElCellByPos(pos)

            cellsOfHints.push(pos)
            removeAddShown(gBoard, pos.i, pos.j)//Show the cell
            if (gBoard[pos.i][pos.j].isMine) {
                elCurrCell.innerText = MINE
            } else if (gBoard[pos.i][pos.j].minesAroundCount > 0) {
                elCurrCell.innerText = gBoard[pos.i][pos.j].minesAroundCount
            }

        }//END FOR
    }//END FOR
    return cellsOfHints
}
function hideHints(cellsOfHints) {
    while (cellsOfHints.length > 0) {
        var CelPos = cellsOfHints.pop()
        renderCell(CelPos.i, CelPos.j, EMPTY)
        removeAddShown(gBoard, CelPos.i, CelPos.j)
    }
}
function hintsRender() {
    var strHTML = ''
    for (var i = 0; i < gHintsCount; i++) {
        strHTML += `<button class="btn-hint" onclick="onclickHintBtn(this)">
        <img src="img/hint.png" width="27px"/></button>`
    }
    var elHintCount = document.querySelector('.hint-count')
    elHintCount.innerHTML = strHTML
}
//Gets 'true' or 'false' for Disabled or Unable the buttons of hints
function disabledUnableHints(isDisabled) {
    var elHints = document.querySelectorAll('.btn-hint')
    for (var i = 0; i < elHints.length; i++) {
        elHints[i].disabled = isDisabled
    }
}

//Gets message and show the message on the box message element
function boxMessage(mess) {
    var elBoxMess = document.querySelector('.mess-box')
    elBoxMess.innerText = mess
}



//For bonus "Life Support"
function showLivesSupport() {
    var elLifeSupport = document.querySelector('.support-life')
    var mess = (gLifeCount) ? gLifeCount + ' LIVES LEFT' : 'YOU LOSE!!'
    elLifeSupport.innerText = mess
    elLifeSupport.style.display = 'block'
    setTimeout(function () {
        elLifeSupport.style.display = 'none'
    }, 1000)
}
function lifeRender() {
    var strHTML = ''
    for (var i = 0; i < gLifeCount; i++) {
        strHTML += 'â¤ï¸'
    }
    var elLifeCount = document.querySelector('.life-count')
    elLifeCount.innerHTML = strHTML
}

//For bonus "manually mine"
function putsManuallyMine(i, j, elCell) {

    removeAddShown(gBoard, i, j)
    if (gBoard[i][j].isMine) {
        elCell.innerText = EMPTY
        gLevel.MINES--
    } else {
        elCell.innerText = MINE
        gLevel.MINES++
    }
    gBoard[i][j].isShown = false
    gBoard[i][j].isMine = !gBoard[i][j].isMine
    renderElement('mines', gLevel.MINES)
}

//For bonus "Best Time"
function getBestTime() {
    try {
        var time;
        switch (gLevel.SIZE) {
            case 4:
                time = localStorage.bestTime4
                break;
            case 8:
                time = localStorage.bestTime8
                break;
            case 12:
                time = localStorage.bestTime12
                break;
        }
        var levelGame = gGame.SIZE
        if (time) {
            var bestTime = time
            bestTime = +bestTime
        } else var bestTime = '--:--'
    } catch (ex) {
        var bestTime = '--:--'
    } finally {
        return bestTime
    }
}
function checkIfBestTime() {
    var endTime = gCurrTime - gStartTime
    if (isNaN(gBestTime) || endTime < gBestTime) {
        return true
    }
    return false
}
function saveOnLocalStorageTime(time) {
    try {
        switch (gLevel.SIZE) {
            case 4:
                localStorage.bestTime4 = time
                break;
            case 8:
                localStorage.bestTime8 = time
                break;
            case 12:
                localStorage.bestTime12 = time
                break;
        }
    } catch (ex) {
        console.log('Error! Failed to update data in local-storage')
    }
}
function renderBestTime(time) {
    if (!isNaN(time)) time = milToFormatTime(time)
    renderElement('best-time h3 span', time)
}
function updateBestTime() {
    var time = gCurrTime - gStartTime
    if (checkIfBestTime()) {
        renderBestTime(time)
        saveOnLocalStorageTime(time)
        gBestTime = time
    }
}

function restMineCount() {
    switch (gLevel.SIZE) {
        case 4: gLevel.MINES = 2
            break;
        case 8: gLevel.MINES = 12
            break;
        case 12: gLevel.MINES = 30
    }
    renderElement("mines", gLevel.MINES)
}

/**Handlers**/
function onclickHintBtn(elHint) {
    if (gIsFirstClick) return

    //UPDATE DOM
    if (isBtnHintClicked) {
        var elHints = document.querySelectorAll('.hint-count button')
        for (let i = 0; i < elHints.length; i++) {
            elHints[i].classList.remove('hint-clicked')
        }
        boxMessage(messBeginGame)
    } else {
        elHint.classList.add('hint-clicked')
        boxMessage(messUseHint)
    }
    isBtnHintClicked = !isBtnHintClicked
}

function onclickResetBtn() {
    if (gIntervalTimer) clearInterval(gIntervalTimer)
    gIntervalTimer = null

    initGame()
}

function onClickBtnLevel(elBtn, level) {
    switch (level) {
        case 1:
            gLevel = { SIZE: 4, MINES: 2 }
            break;
        case 2:
            gLevel = { SIZE: 8, MINES: 12 }
            break;
        case 3:
            gLevel = { SIZE: 12, MINES: 30 }
    }
    onclickResetBtn()
}

//For bonuses
function onClickBtnSafe() {
    var emptyCells = getEmptyPlaces(gBoard)
    if (emptyCells.length < 0) {
        boxMessage(messNoSafe)
    } else if (!gIsSafeModOn) {
        var IdxRandom = getRandomInteger(0, emptyCells.length - 1)
        var pos = emptyCells[IdxRandom]
        var cell = getElCellByPos(pos)
        cell.classList.toggle('safe-cell')
        gSafeUseCount--
        renderElement('count-safe', gSafeUseCount)//Render 'Safe-Mod' button
        gSafeCell = cell
        if (!gSafeUseCount) {
            showHideElement('box-safe')
            boxMessage(messUsedAllSafe)
        } else boxMessage('You left ' + gSafeUseCount + ' "Safe" available')
    }
    gIsSafeModOn = true
}
function onClickBtnManually() {
    if (gIsManuallyModOn) {
        document.querySelector('.btn-manually').innerText = 'Manually Mod'
        showHideElement('btn-manually')
        gIsStartGameClicked = true
        renderBoard(gBoard)
    } else {
        gIsManuallyModOn = true
        boxMessage(messManuallyMode)
        document.querySelector('.btn-manually').innerText = 'START GAME'
        gLevel.MINES = 0
        renderElement('mines', gLevel.MINES)
    }
}

function onClickBtnUndo() {

}


function victory() {
    var mess = messVictor
    if (checkIfBestTime()) mess += messBestTime
    gameOver(mess, SUNGLASSES)
    updateBestTime()
}
function lose() {
    gameOver(messFailed, SAD)
    openAllCells()
}

