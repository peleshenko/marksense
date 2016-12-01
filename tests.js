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

    it("Command param with pre should have correct value", function(){
        var sense = new Sense();
        var doc = sense.make("   :test \\\n`\nThis is a test\n`");
        var b = doc.blocks[0];
        test.must(b.params[0]).be
            .equal("This is a test");
    });

    it("Line command param with pre should have correct value", function(){
        var sense = new Sense();
        var doc = sense.make(":cmd\n   :test \\\n   `\nThis is a test\n   `");
        var b = doc.blocks[0].lines[0][0];
        test.must(b.params[0]).be
            .equal("This is a test");
    });
});

describe("List items", function(){
    it("Item text should contain text", function(){
        var sense = new Sense();
        var doc = sense.make("- This is a test");
        var b = doc.blocks[0];
        test.must(b.lines[0][0].text).be
            .equal("This is a test");
    });

    it("Item line should contain single fragment with command '-'", function(){
        var sense = new Sense();
        var doc = sense.make("- This is a test");
        var b = doc.blocks[0];
        test.must(b.lines[0].length).be.equal(1);
        test.must(b.lines[0][0].command).be.equal("-");
    });

    it("Items block command should be empty", function(){
        var sense = new Sense();
        var doc = sense.make("- This is a test\n- another line");
        var b = doc.blocks[0];
        test.must(b.command).be
            .equal("");
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

    it("Header should have correct command name", function(){
        var sense = new Sense();
        var doc = sense.make("## This is a test");
        var b = doc.blocks[0];
        test.must(b.command).be.equal("#");
    });

     it("Header should have correct level", function(){
        var sense = new Sense();
        var doc = sense.make("### This is a test");
        var b = doc.blocks[0];
        test.must(b.params[1]).be.equal(3);
    });

    it("Header should have isHeader = true", function(){
        var sense = new Sense();
        var doc = sense.make("## This is a test");
        var b = doc.blocks[0];
        test.must(b.isHeader()).be.equal(true);
    });
});