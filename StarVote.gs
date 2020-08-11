/**
 * @OnlyCurrentDoc
 */

//Sorry for weird data types in some descriptions, i'm used to statically typed languages

/**
 * Shows modal with new question form
 */
function showMultiChoiceVote() {
    var ui = HtmlService.createHtmlOutputFromFile('newMultiVoteForm')
        .setTitle('Nowe Głosowanie');
    FormApp.getUi().showSidebar(ui);
}

/**
 * Add new multi choice question based on data from sidebar form
 *
 * @param {object} inputForm object contains values from newMutliVoteForm
 */
function initializeMultiChoiceVote(inputForm) {
    var form = FormApp.getActiveForm();
    var itemCount = inputForm.count;
    for (var i = 0; i < itemCount; i++) {
        var item = form.addScaleItem();
        var optionNumber = i + 1;
        item.setTitle("Opcja " + optionNumber).setBounds(0, 5);
    }
    addTextItem(form, 'Czy zgłaszasz Krytyczne Zastrzeżenie?');
    drawLine(form);
}

/**
 * Shows modal with calculate form
 */
function showCalculateStarVote() {
    var ui = HtmlService.createHtmlOutputFromFile('calculateStarVote')
        .setTitle('Oblicz wyniki');
    FormApp.getUi().showSidebar(ui);
}

/**
 * Star vote results calculation based on https://www.equal.vote/star_election_calculator
 *
 * @param {text} spreadsheetName name of spreadsheet to create
 */
function calculateStarVote(spreadsheetName) {
    var form = FormApp.getActiveForm();
    var allResponses = form.getResponses();
    var allScaleItems = form.getItems(FormApp.ItemType.SCALE);
    if (allResponses.length === 0)
        return;

    var voteResponses = filterVoteResponses(allScaleItems, allResponses);
    var starResult = getCalculatedResultRows(voteResponses);
    return createResultSpreadsheet(spreadsheetName, voteResponses, starResult);
}

/**
 * Filters all responses based on Item type. In this case it should filtered by ItemType.SCALE
 *
 * @return {object} { candidateNames:String[], ballots: [{ candidateName:String, responseItems:ItemResponse[] }]  }
 * @param {ScaleItem[]} allScaleItems all ScaleItems in active form
 * @param {FormResponse[]} allResponses all form ResponseItems
 */
function filterVoteResponses(allScaleItems, allResponses) {
    var voteResponses = [];
    for (var r = 0; r < allResponses.length; r++) {
        voteResponses[r] = {"candidateName": '', "responseItems": []};
        for (var i = 0; i < allScaleItems.length; i++) {
            var scaleItem = allScaleItems[i];
            var response = parseInt(allResponses[r].getResponseForItem(scaleItem).getResponse());
            voteResponses[r].candidateName = scaleItem.getTitle();
            voteResponses[r].responseItems[i] = response;
        }
    }

    var candidateNames = [];
    for (var i = 0; i < allScaleItems.length; i++) {
        candidateNames[i] = allScaleItems[i].getTitle();
    }

    return {"candidateNames": candidateNames, "ballots": voteResponses};
}


/**
 * Calculates results and returns result data
 *
 * @param {object} voteResponses Vote Responses object { candidateNames:String[], ballots: [{ candidateName:String, responseItems:ItemResponse[] }]  }
 * @return {object} StarResult object {
 *  resultRows: [{ "name": String, "score":Integer, "average":Double, "preferences":Integer[] }], winner: Integer, loser: Integer }
 *}
 */
function getCalculatedResultRows(voteResponses) {
    var candidateNames = voteResponses.candidateNames
    var ballots = voteResponses.ballots;
    var totalVotes = 0;
    var candidateScores = fillArrayWithZeroes([], candidateNames.length);


    // Matrix[x][y]: Count of preferences of x candidate over y candidate
    var preferenceMatrix = [];
    for (var i = 0; i < candidateNames.length; i++) {
        preferenceMatrix[i] = fillArrayWithZeroes([], candidateNames.length);
    }

    for (var b = 0; b < ballots.length; b++) {
        var ballot = ballots[b];
        totalVotes++;

        var scores = [];
        for (var i = 0; i < candidateNames.length; i++) {
            scores[i] = ballot.responseItems[i];
        }


        for (var c = 0; c < candidateNames.length; c++) {
            candidateScores[c] += scores[c]
            for (var d = 0; d < candidateNames.length; d++) {
                if (scores[c] > scores[d]) {
                    preferenceMatrix[c][d] += 1;
                }
            }
        }
    }

    var resultRows = [];
    for (var c = 0; c < candidateNames.length; c++) {
        resultRows[c] = {
            "name": candidateNames[c],
            "score": candidateScores[c],
            "average": candidateScores[c] / totalVotes,
            "preferences": preferenceMatrix[c]
        };
    }

    var topFoo = 0;
    var topBar = 1;
    for (var c = topBar + 1; c < candidateNames.length; c++) {
        if (candidateScores[c] > candidateScores[topFoo]) {
            if (candidateScores[topFoo] > candidateScores[topBar]) {
                topBar = topFoo;
            }
            topFoo = c;
        } else if (candidateScores[c] > candidateScores[topBar]) {
            topBar = c;
        }
    }

    var winner;
    var loser;
    if (preferenceMatrix[topFoo][topBar] >= preferenceMatrix[topBar][topFoo]) {
        winner = topFoo;
        loser = topBar;
    } else {
        winner = topBar;
        loser = topFoo;
    }


    return {
        "resultRows": resultRows,
        "winner": winner,
        "loser": loser
    };
}


function fillArrayWithZeroes(arr, size) {
    for (var i = 0; i < size; i++) {
        arr[i] = 0;
    }
    return arr;
}

/**
 * Creates new spreadsheet and adds formatted and calculated results there
 *
 * @param spreadsheetName name of spreadsheet to create
 * @param {object} voteResponses Vote Responses object { candidateNames:String[], ballots: [{ candidateName:String, responseItems:ItemResponse[] }]  }
 * @param {object} starResult StarResult object {
 *  resultRows: [{ "name": String, "score":Integer, "average":Double, "preferences":Integer[] }], winner: Integer, loser: Integer }
 *}
 *
 */
function createResultSpreadsheet(spreadsheetName, voteResponses, starResult) {
    var spreadsheet = SpreadsheetApp.create(spreadsheetName);
    url = spreadsheet.getUrl();
    SpreadsheetApp.openByUrl(url);
    result_sheet = spreadsheet.getActiveSheet();
    result_sheet.setName("Results");

    function versus(x) {
        return 'vs. ' + x
    }

    result_sheet.appendRow(['Rezultat głosowania:']);
    result_sheet.appendRow(['', 'Suma', 'Średni Wynik'].concat(voteResponses.candidateNames.map(versus)));
    result_sheet.getRange(2, 2, 1, 2 + voteResponses.candidateNames.length).setHorizontalAlignment("right");

    for (c = 0; c < voteResponses.candidateNames.length; c++) {
        starResult.resultRows[c].preferences[c] = '';
        result_sheet.appendRow([voteResponses.candidateNames[c], starResult.resultRows[c].score, starResult.resultRows[c].average].concat(starResult.resultRows[c].preferences));
        result_sheet.getRange(3 + c, 3).setNumberFormat("0.00");
        result_sheet.getRange(3 + c, 4 + c).setBackgroundRGB(180, 180, 180);
    }

    result_sheet.getRange(3 + starResult.winner, 1, 1, 2).setBackgroundRGB(128, 255, 128);
    result_sheet.getRange(3 + starResult.loser, 1, 1, 2).setBackgroundRGB(128, 255, 128);
    result_sheet.getRange(3 + starResult.winner, 4 + starResult.loser).setBackgroundRGB(128, 255, 128);
    result_sheet.getRange(3 + starResult.loser, 4 + starResult.winner).setBackgroundRGB(128, 255, 128);

    result_sheet.appendRow([' ']);
    result_sheet.appendRow(['Dwie najwyższe opcje to ' + voteResponses.candidateNames[starResult.winner] + ", z wynikiem " + starResult.resultRows[starResult.winner].score + ", i " + voteResponses.candidateNames[starResult.loser] + ", z wynikiem " + starResult.resultRows[starResult.loser].score]);
    result_sheet.appendRow([voteResponses.candidateNames[starResult.winner] + " było preferowane ponad " + voteResponses.candidateNames[starResult.loser] + ", " + starResult.resultRows[starResult.winner].preferences[starResult.loser] + " do " + starResult.resultRows[starResult.loser].preferences[starResult.winner] + "."]);
    result_sheet.appendRow([' ']);

    //If tie ;_;
    if (starResult.resultRows[starResult.winner].score === starResult.resultRows[starResult.loser].score && starResult.resultRows[starResult.winner].preferences[starResult.loser] === starResult.resultRows[starResult.loser].preferences[starResult.winner]) {
        result_sheet.appendRow(['Remis']);
        result_sheet.appendRow(['Obie opcje mają takie same wyniki i preferencje']);
    } else {
        result_sheet.appendRow(['Zwycięzcą jest: ' + voteResponses.candidateNames[starResult.winner]]);
    }

    return url;
}