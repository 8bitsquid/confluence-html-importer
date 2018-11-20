module.exports.run = function(elm, $){

    // Since we need the '<table>' element itself returned, we wrap everything in
    // another element, as .html() only returns the "innerHTML" (e.g., $('table').html() would return starting at '<tbody>' or '<thead>')
    var table = $('<textarea/>').html(elm.clone());

    table.children().addClass('wrapped confluenceTable');
    table.children().children('tbody').children('tr').children('td').addClass('confluenceTd');
    table.children().children('tbody').children('tr').children('th').addClass('confluenceTh');

    return {
        tableHtml: table.html()
    }
}