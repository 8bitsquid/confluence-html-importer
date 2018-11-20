const fs = require('fs');
const glob = require("glob");
const { JSDOM } = require('jsdom');
const Mustache = require('mustache');
const axios = require('axios');
const args = require('yargs').argv;
const merge = require('deepmerge');

let $ = '';

let auth = args.auth || null;
let docPath = args.path || 'test_docs';
let confluenceURL = 'https://dtools.ipsoft.com/confluence/rest/api/content/'

let payloadDefaults = {
    "type": "page",
    "body": {
        "storage": {
            "representation": "storage"
        }
    },
    "version": {
        "number": 1
    }
};


glob(docPath + "/**/*.html", {}, function(er, f){

    f.forEach(function(htmlFile) {

        JSDOM.fromFile(htmlFile).then(function(dom){

            // init doc config variables for confluence page ID and the selector for the content wrapper element
            // page ID is required to update docs. No creating new confluence pages from this script.
            var config = {
                confluenceID: null,
                contentWrapper: '.main'
            };

            // Why yes. I am bringing jQuery into this. READ: I'm too lazy to do all the DOM operations manually and this is the most common library for that.
            // This also avoids regex-hell that can happen when parsing so many tags our of an HTML doc
            $ = (require('jquery'))(dom.window);

            // grab metadata from HTML comments in source document
            $("*")
                .contents()
                .filter(function(){
                    return this.nodeType === 8; // Filter for HTML comment elements
                })
                .each(function(i, e){
                    var c = e.nodeValue.trim().split(':');

                    if (config.hasOwnProperty(c[0])){
                        config[c[0]] = c[1].trim();
                    }
                });

            // Only process templates if confluenceID is found
            if (config.confluenceID){
                var templateFiles = glob.sync("**/*.tpl.html");

                // Iterate through each template file, perform any processing, then replace the original
                // element with the rendered template
                templateFiles.forEach(function(file){
                    var tplName = file.split('\/');
                    tplName = tplName[tplName.length-1].split('\.')[0];

                    $('.'+tplName).each(function(){
                        var elm = $(this);
                        var js = file.split('\.')[0] + '.js';
                        var elmData = require('./' + js).run(elm, $);


                        var template = fs.readFileSync(file);
                        elm.replaceWith(Mustache.render(template.toString(), elmData));
                    })
                });



                // The "<br/>" tags get converted in invalid "<br>" tags along the way. Confluence requires valid HTML, so we need to manually fix the <br> tabs
                var html = $(config.contentWrapper).html().replace(/<br>/g, '<br/>');

                // Get confluence page
                getConfluencePage(config.confluenceID)
                    .then(function(response){

                        var data = response.data;

                        // merge page info with payload defaults and converted HTML doc
                        var payload = merge(payloadDefaults, {
                            "id": data.id,
                            "body": {
                                "storage": {
                                    "value": html
                                }
                            },
                            "title": data.title,
                            "version": {
                                "number": data.version.number + 1
                            }
                        });

                        // Update the confluence page with the newly merged payload
                        putConfluencePage(config.confluenceID, payload)
                            .then(function(){
                                console.info('SUCCESS:    Confluence updated page [Title: "' + payload.title + '", ID: ' + payload.id + ']')
                            })
                            .catch(function(error){
                                console.error('ERROR:    Confluence page not updated:  ', error.response)
                            })
                    })
                    .catch(function(error){
                        console.error('ERROR:   Confluence page could not be reached:  ', error.response)
                    });
            }
        });
    });
});


function getConfluencePage(pageID){
    return axios({
        method: "GET",
        url: "/"+pageID,
        baseURL: confluenceURL,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        headers: {
            'Authorization': 'Basic ' + auth
        }
    })
}

function putConfluencePage(URI, payload){
    return axios({
        method: "PUT",
        url: "/" + URI,
        baseURL: confluenceURL,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        headers: {
            'Authorization': 'Basic ' + auth
        },
        data: payload
    })
}