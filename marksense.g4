grammar marksense;

program         : block*;
block           : (command_block | text_block | header_block);
command_block   : command (NL line)* ((NL WS* (NL WS*)+) | EOF);
text_block      : (string | item) (NL line)* (NL WS* (NL WS*)+ | NL? WS* EOF);
header_block    : header NL+ | header EOF;

line            : (item | string | command | header | pre_block);
item            : LIST string;
string          : (inline_string | inline_highlight) (WS+(inline_string | inline_command | inline_highlight))*;
inline_command  : OPERATOR id 
                | OPERATOR id BEGIN text_fragemnet END;
inline_string   : WS* CHAR+ (WS | SYMBOL | CHAR | ESCAPE)*;

inline_highlight: HIGHLIGHT text_fragemnet HIGHLIGHT; 

text_fragemnet  : (WS | SYMBOL | CHAR | ESCAPE)*;

id              : CHAR+ | (QUOTE (WS | SYMBOL | CHAR | ESCAPE)* QUOTE);
command         : OPERATOR id (WS id)* WS*;
header          : HDR (WS | SYMBOL | CHAR | ESCAPE)*;

pre_block       : 
    PRE 
                ( ESCAPE 
                | OPERATOR 
                | HDR 
                | NL 
                | WS 
                | CHAR 
                | HIGHLIGHT 
                | QUOTE
                | BEGIN
                | END
                | LIST
                | SYMBOL)*
    PRE; 

// Lexer rules
ESCAPE      : '\\(' | '\\)' | '\\"' | '\\:' | '\\-' | '\\*' | '\\#' | ('\\' NL) | '\\`';
OPERATOR    : ':';
HDR         : '#'+ ('\t'|' ')*;
NL          : '\n';
WS          : ('\t'|' ')+;
CHAR        : 'a'..'z'|'A'..'Z'|'0'..'9';//|'\u00C0'..'\uFFFD';
HIGHLIGHT   : '*'+;
QUOTE       : '"';
BEGIN       : '(';
END         : ')';
LIST        : '-'+ ('\t'|' ')*;
PRE         : '`';
SYMBOL      : ~('\n' | '"' | ':' | ')' | '(' | '-' | '*' | '`');

