# Confluence HTML Importer

> The tool is designed to import HTML documents into Confluence. This is designed to be used as part of an automated process, when documentation are updated in a repo, to migrate those docs to confluence automatically. However, you can use this as a publishing tool. Writing your docs in locally, then importing them into confluence.

*Note: Currently, this will only update existing confluence pages. This is to prevent any possibility of accidentally flooding confluence with multiple copies of the same page*

## Getting Started

First we need to create and empty confluence page, get the page's confluence ID, then tag the HTML document we wish to import with that information

### Create the Confluence Page
1. Create an empty page on confluence, giving it a title.
2. After the page is created, click the three dots at the top right (*...*)
3. Select "Page Information"
4. From the URL, grab the numbers after 'pageId='. We will use the page ID to link the confluence page and HTML doc

### Link the HTML and Confluence Docs

The HTML document to be imported needs two pieces of information. The confluence page ID and the HTML element that contains the
information you wish to import (you don't want to import the `<html>`, `<head>` tags or any other framework html like menus, headers, or footers).

#### Add the confluence page ID

If the HTML document, place this comment with the page ID anywhere in the markup (preferably somewhere obvious, like the top of the head, or body)
```html
<!-- confluenceID: XXXXXXXX -->
```

#### Define the content wrapper

The content wrapper is the parent element of the markup you wish to import into Confluence. Most query selectors can be used (e.g., `.className`, `#elementID`, or `tagname`)
```html
<!-- contentWrapper: main -->
```
> This example above will import markup inside the `<main>` tag


### Importing

Run the following command from this repo's folder

```
node index.js --auth BASE64_ENCODED_AUTH --path path/to/html/docs
```

This script does not accept raw username or password. You can base64 encode your confluence credentials via command line:

```
echo -n username:pass | base64
```

## Converting Your Styles to Confluence Styles

> This script is built to convert Bootstrap styles/components to Confluence, but can convert element/style if a conversation template exists

You can create custom transformations and templating to convert to Confluence styles and components. Each element is identified by class.
The class name _must_ be the name for the the files used to transform the element: a javascript file, and a HTML template file.

_Note: The Confluence conversation templates use [Mustache Templating](https://github.com/janl/mustache.js#templates)_

### Conversion Template Example: Bootstrap Alerts

This example will demonstrate how to create a Confluence conversion template for [Bootstrap alert components](http://getbootstrap.com/docs/3.3/components/#alerts) 

#### Creating an `alert-info` conversation template

Let's start by creating the directory and files we'll need

1. First we need to create a folder in the `templates` directory of this repo. All conversation templates are housed here. In this case, name the
directory after the element's class `./templates/alert-info`
2. Next we need to create the conversation HTML template: `alert-info.tpl.html`. Conversation HTML templates are identified by their file extension: `*.tpl.html`
and should _always_ match the element's class name
3. Next create the conversion template's javascript file: `alert-info.js`. This javascript file is what defines the Mustache template object
and performance any other custom transformations

Now that we have the file structure we need, we can create the Mustache template object. For the alert, we only need the alert text from the bootstrap component:
```javascript
// Why yes, the "$" means jQuery
module.exports.run = function(elm, $){
    return {
        alertText: elm.text()
    }
}
```
> In the script above, we defined the `run()` method to be executed for each `.alert-info` element. From the `run()` method you can access the
element (elm) or even the whole jQuery document (`$`). jQuery is used as a convenience layer, so you can run jQuery methods on the element

Next we can create our template markup in `alert-info.tpl.html`:
```html
<div class="confluence-information-macro confluence-information-macro-information conf-macro output-block" data-hasbody="true" data-macro-name="info">
    <span class="aui-icon aui-icon-small aui-iconfont-info confluence-information-macro-icon"> </span>
    <div class="confluence-information-macro-body">
        <p>{{alertText}}</p>
    </div>
</div>
```

_Note: For a slightly more advanced example, see the `table` conversation filter in the `templates` directory_

