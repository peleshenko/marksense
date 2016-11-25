const Sense = require("./index.js");

var sense = new Sense({
    document: (document) => {
        console.log("<html>"); 
        console.log("<head>");        
        document.commands("title")
                    .forEach(x => console.log(`<title>${x.params[0]}</title>`));
        console.log("</head>");
        console.log("<body>");

        document.commands(null, "title")
                    .process([
            {   condition: x => x.isHeader(),
                action: x => console.log(`<h${x.headerLevel()}>${x.text}</h${x.headerLevel()}>`) },

            {   condition: x => x.isText(),
                action: x => console.log(x.text)  },

            {   action: x => console.log(`<${x.command}>${x.text}</${x.command}>`) }
        ]);
        
        console.log("</body>")
        console.log("</html>"); 
        
    },
    fragment: (fragment) => {
        if(fragment.command == "code"){
            fragment.text = `<code>${fragment.text}</code>`;
        } 
        if(fragment.isHighlight()){
            fragment.text = `<b>${fragment.text}</b>`;
        }
        if(fragment.isListItem()){
            fragment.text = `<li>${fragment.params.map(x=>x.text).join(" ")}</li>`;
        }
    }
});

sense.makeFile("./test.sns");
