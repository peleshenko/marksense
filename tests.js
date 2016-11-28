const test = require("unit.js");
const Sense = require("./index.js");



describe("Pre", function(){
    it("Pre with spaces before should remove spaces in pre lines", function(){
        var sense = new Sense();
        var doc = sense.make(":title test\n\n   :code\n   `\n   test\n    test2\n  `\n");
        
        test.must(doc.blocks[1].lines[0].text).be
            .equal("test\n test2");
    });

    it("Pre with spaces before should trunc not lines with not enough spaces", function(){
        var sense = new Sense();
        var doc = sense.make(":title test\n\n   :code\n   `\n   test\n test2\n  `\n");
        
        test.must(doc.blocks[1].lines[0].text).be
            .equal("test\nst2");
    });
});

describe("Command", function(){
    it("Command with spaces before should be parsed as usual", function(){
        var sense = new Sense();
        var doc = sense.make("   :title test\n   This is a test");
        var b = doc.blocks[0];
        test.must(b.lines[0].text).be
            .equal("This is a test");

        test.must(b.command).be.equal("title");
        
        test.must(b.params[0]).be.equal("test");
    });

    it("Command symbol should only be command at the beginning of the word" , function(){
        var sense = new Sense();
        var doc = sense.make("   :title\n   This: is a test");
        var b = doc.blocks[0];
        test.must(b.lines[0].text).be
            .equal("This: is a test");
    });
});