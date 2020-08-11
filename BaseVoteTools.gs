/**
 * @OnlyCurrentDoc
 */

/**
 * Adds a custom menu to the active form to show the add-on sidebar.
 *
 * @param {object} e The event parameter for a simple onOpen trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode.
 */
function onOpen(e) {
    FormApp.getUi()
        .createAddonMenu()
        .addItem('Inicializuj process głosowania', 'initializeVote')
        .addItem('Dodaj głosowanie jedna opcja (Za/Przeciw)', 'showSingleVoteForm')
        .addItem('Dodaj głosowanie z wieloma opcjami (Star Vote)', 'showMultiChoiceVote')
        .addItem('Oblicz wyniki głosowania wielu opcji (Star Vote)', 'showCalculateStarVote')
        .addItem('Wyczyść formularz', 'showClearForm')
        .addToUi();
}

/**
 * Runs when the add-on is installed.
 */
function onInstall(e) {
    onOpen(e);
}

function showClearForm() {
    var ui = HtmlService.createHtmlOutputFromFile('clearVoteForm').setTitle('Wyczyść Formularz');
    FormApp.getUi().showSidebar(ui);
}


function clearForm() {
    var form = FormApp.getActiveForm();
    var items = form.getItems();
    while (items.length > 0) {
        form.deleteItem(items.pop());
    }
}

/**
 * Initializes vote, adds name and sets form description
 * Should be run first before other methods
 */
function initializeVote() {
    clearForm();
    var form = FormApp.getActiveForm();
    form.setDescription('Wszelkie komentarze piszemy w odpowiedniej karteczce na trello. Zasady jak podejmujemy decyzje opisane są tutaj: ' + 'https://trello.com/c/DpMwdcy2/228-jak-podejmujemy-różne-decyzje');
    addNameQuestion(form);
    form.setAllowResponseEdits(true)
    form.setPublishingSummary(false)
    form.setShowLinkToRespondAgain(false)
}

function addNameQuestion(form) {
    var textItem = form.addTextItem();
    textItem.setTitle('Podaj swój nick / imię');
    textItem.setRequired(true);
}