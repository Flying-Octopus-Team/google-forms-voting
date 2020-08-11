/**
 * @OnlyCurrentDoc
 */

/**
 * Shows modal with new question form
 */
function showSingleVoteForm() {
    var ui = HtmlService.createHtmlOutputFromFile('newVoteForm')
        .setTitle('Nowe Głosowanie');
    FormApp.getUi().showSidebar(ui);
}

/**
 * Add new question based on data from sidebar form
 *
 * @param formInput object contains values from newVoteForm
 */
function addSingleVote(formInput) {
    var form = FormApp.getActiveForm();
    addSingleVoteQuestions(form, formInput.question, formInput.description);
}


function addSingleVoteQuestions(form, question, description) {
    addYesNoQuestion(form, question, description);
    addTextItem(form, 'Czy zgłaszasz Krytyczne Zastrzeżenie?');
    drawLine(form);
}

function addYesNoQuestion(form, question, description) {
    form.addMultipleChoiceItem()
        .setTitle(question)
        .setHelpText(description)
        .setChoiceValues(['Za',
            'Przeciw']);
}

function addTextItem(form, title) {
    var textItem = form.addParagraphTextItem();
    textItem.setTitle(title);
}

function drawLine(form) {
    var img = UrlFetchApp.fetch('https://909sickle.net/s/ironic-twist/ironic-twist.png');
    form.addImageItem().setImage(img);
}