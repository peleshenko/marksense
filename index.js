const antlr4 = require("antlr4");
const sensLexer = require("./marksenseLexer");
const sensParser = require("./marksenseParser");
const sensListener = require("./marksenseListener");
const fs = require("fs");


var Document = function(blocks){
    this.blocks = blocks;
    // this.text = "";
    // for(var i in this.blocks){
    //     this.text += this.blocks[i].text + "\n";
    // }
}

Document.prototype.texts = function() {
    return new Document(this.blocks.filter(x => x.isText()));
}

Document.prototype.commands = function(include, exclude) {
    return new Document(this.blocks.filter(x => (!include || x.command == include) && 
                                                (!exclude || x.command != exclude)));
}

Document.prototype.filter = function(filter) {
    return new Document(this.blocks.filter(filter));
}

Document.prototype.forEach = function(action) {
    this.blocks.forEach(action);
    return this;
}

Document.prototype.process = function(handlers) {
    this.blocks.forEach(x => {
        for(var i = 0; i < handlers.length; i++) {
            if(!handlers[i].condition || handlers[i].condition(x)){
                handlers[i].action(x);
                break;
            }
        }
    });

    return this;
}

var Block = function(command, params, lines, text) {
    this.command = command;
    this.params = params;
    this.lines = lines;
    this.text = text;
    this.fragments = []; 
    this.lines.forEach(l => l.forEach(x => this.fragments.push(x)));
}

Block.prototype.isHeader = function() {
    return this.headerLevel() > 0;
} 

Block.prototype.headerLevel = function() {
    if(!this.command)
        return 0;
    if(this.command.length > 12)
        return 0;
    for(var i = 0; i < this.command.length; i++)
        if(this.command[i] != "#")
            return 0;
    
    return this.command.length;
} 

Block.prototype.isText = function() {
    return this.command == "";
} 

var Fragment = function(command, params, text) {
    this.command = command;
    this.params = params;
    this.text = text;
}

Fragment.prototype.isHeader = function() {
    return this.headerLevel() > 0;
} 

Fragment.prototype.headerLevel = function() {
    if(!this.command)
        return 0;
    if(this.command.length > 12)
        return 0;
    for(var i = 0; i < this.command.length; i++)
        if(this.command[i] != "#")
            return 0;
    
    return this.command.length;
}

Fragment.prototype.isHighlight = function() {
    return this.highlightLevel() > 0;
} 

Fragment.prototype.highlightLevel = function() {
    if(!this.command)
        return 0;
    if(this.command.length > 12)
        return 0;
    for(var i = 0; i < this.command.length; i++)
        if(this.command[i] != "*")
            return 0;
    
    return this.command.length;
} 

Fragment.prototype.isListItem = function() {
    return this.listItemLevel() > 0;
} 

Fragment.prototype.listItemLevel = function() {
    if(!this.command)
        return 0;
    if(this.command.length > 12)
        return 0;
    for(var i = 0; i < this.command.length; i++)
        if(this.command[i] != "-")
            return 0;
    
    return this.command.length;
} 

Fragment.prototype.isText = function() {
    return this.command == "";
} 

var defaultHandlers = {
    beforeDocument: () => { },
    document: (value) => { },
    block: (value) => { },
    line: (value) => { },
    fragment: (value) => { }
};


Listener = function(handlers){
    if(!handlers) 
        handlers = defaultHandlers;
    this.handlers = handlers;
    
    if(!this.handlers.beforeDocument) 
        this.handlers.beforeDocument = defaultHandlers.beforeDocument;
    
    if(!this.handlers.document) 
        this.handlers.document = defaultHandlers.document;
    
    if(!this.handlers.block) 
        this.handlers.block = defaultHandlers.block;
    
    if(!this.handlers.line) 
        this.handlers.line = defaultHandlers.line;

    if(!this.handlers.fragment) 
        this.handlers.fragment = defaultHandlers.fragment;

    sensListener.marksenseListener.call(this);
    return this;
}

Listener.prototype = Object.create(sensListener.marksenseListener.prototype);
Listener.prototype.constructor = Listener;

Listener.prototype.makeFile = function(path) {
    var input = fs.readFileSync(path, { encoding: "utf8" });
    return this.make(input);
}

Listener.prototype.make = function(input) {
    this.document = null;
    this.input = input;
    var chars = new antlr4.InputStream(input);
    var lexer = new sensLexer.marksenseLexer(chars);
    var tokens  = new antlr4.CommonTokenStream(lexer);
    var parser = new sensParser.marksenseParser(tokens);
    var errors = [];
    parser.addErrorListener({
        syntaxError: function(r, o, line, pos, msg, e){
            errors.push({
                line: line,
                position: pos,
                message: msg
            });
        },
        reportAttemptingFullContext : function (){},
        reportContextSensitivity: function(){},
        reportAmbiguity: function(){}
    });
    parser.buildParseTrees = true;

    var tree = parser.program();
    if(!errors.length){
        antlr4.tree.ParseTreeWalker.DEFAULT.walk(this, tree);
    }
    return this.document;
}

Listener.prototype.enterProgram = function(ctx) {
    this.handlers.beforeDocument();
}

Listener.prototype.exitProgram = function(ctx) {
    this.document = new Document(ctx.children.map(x => x.value));
    this.document.text = this.input;
    this.handlers.document(this.document);
}

Listener.prototype.exitBlock = function(ctx) {
    ctx.value = ctx.children[0].value;
    this.handlers.block(ctx.value);
}

Listener.prototype.exitCommand_block = function(ctx) {
    var parts = ctx.children
                   .filter(x => x.value)
                   .map(x => x.value);
    var command = parts.shift()[0];
    ctx.value = new Block(command.command, command.params, parts, parts.map(x => x.map(f => f.text).join(" ")).join(" "));
}

Listener.prototype.exitText_block = function(ctx) {
    var lines = ctx.children.filter(x => x.value)
                            .map(x => x.value);
    ctx.value = new Block("", [], lines, lines.map(x => x.map(f => f.text).join(" ")).join(" "));
}

Listener.prototype.exitHeader_block = function(ctx) {
    var text = ctx.children[0].value.map(x => x.text).join("");
    ctx.value = new Block(
        "#",
        [text, ctx.children[0].value[0].headerLevel()],  
        [ctx.children[0].value],
        text);
}

Listener.prototype.exitLine = function(ctx) {
    ctx.value = ctx.children[0].value;
    ctx.value.text = ctx.children[0].value.map(x => x.text).join(" ");
    if(ctx.children[0].command)
        this.handlers.fragment(ctx.children[0].value[0]);    
    this.handlers.line(ctx.value);
}

Listener.prototype.exitItem = function(ctx) {
    var fragments = ctx.children[1].value;
    var command = ctx.children[0].getText().trimRight();
    var level = command.length;
    var params = [];
    fragments.forEach(x => params.push(x));
    ctx.value = [new Fragment(command, params, fragments.map(x => x.text).join(" "))];
    this.handlers.fragment(ctx.value[0]);
}

Listener.prototype.exitString = function(ctx) {
    ctx.value = ctx.children.filter(x => x.value)
                            .map(x => x.value);
}

Listener.prototype.exitPre_block = function(ctx) {
    var tabSize = ctx.children[0].getText().length - 1; 
    var text = ctx.getText();
    var lines = text.split("\n");
    ctx.value = [new Fragment(
        "", 
        [], 
        lines.slice(1, -1)
             .map(x => x.slice(tabSize))
             .join("\n"))];
}

Listener.prototype.exitInline_command = function(ctx) {
    var command = ctx.children[1].getText();
    var content = ctx.children.length > 2 ? ctx.children[3].getText() : null;
    ctx.value = new Fragment(command, [], content);
    this.handlers.fragment(ctx.value);
}

Listener.prototype.exitInline_highlight = function(ctx) {
    var text = ctx.children[1].getText();
    var level = ctx.children[0].length;
    ctx.value = new Fragment(ctx.children[0].getText(), [], text);
    this.handlers.fragment(ctx.value);
}

Listener.prototype.exitInline_string = function(ctx) {
    ctx.value = new Fragment("", 
        [], 
        ctx.getText()
           .trimLeft()
           .replace(/\\\n/g,"\n")); 
    this.handlers.fragment(ctx.value);
}

Listener.prototype.exitCommand = function(ctx) {
    var parts = ctx.children
                   .filter(x => x.value)
                   .map(x => x.value);
    
    var name = parts.shift();
    ctx.command = true;
    ctx.value = [new Fragment(name, parts, null)];
}

Listener.prototype.exitId = function(ctx) {
    // Handle pre_block in ID
    if(ctx.children[0].value) {
        ctx.value = ctx.children[0].value[0].text;
    } else {
        ctx.value = ctx.getText();
        if(ctx.value.startsWith('"') && ctx.value.endsWith('"'))
            ctx.value = ctx.value.substr(1, ctx.value.length - 2);
    }
}

Listener.prototype.exitHeader = function(ctx) {
    var parts = ctx.children.slice(1).map(x => x.getText());
    var command = ctx.children[0].getText().trimRight(); 
    var level = command.length;
    ctx.value = [new Fragment(command, [], parts.join(""))];
}

module.exports = Listener;