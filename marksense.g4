grammar marksense;

program         : block*;
block           : (command_block | text_block | header_block);
command_block   : command (NL line)* NL WS* (NL WS*)+ | command (NL WS*)* EOF;
text_block      : (string | item) (NL line)* (NL WS* (NL WS*)+ | NL? WS* EOF);
header_block    : header NL+ | header EOF;

line            : (item | string | command | header);
item            : LIST string;
string          : (inline_string | inline_highlight) (WS+(inline_string | inline_command | inline_highlight))*;
inline_command  : OPERATOR id 
                | OPERATOR id BEGIN text_fragemnet END;
inline_string   : WS* CHAR+ (WS | SYMBOL | CHAR)*;

inline_highlight: HIGHLIGHT text_fragemnet HIGHLIGHT; 

text_fragemnet  : (WS | SYMBOL | CHAR)*;

id              : CHAR+ | (QUOTE (WS | SYMBOL | CHAR)* QUOTE);
command         : OPERATOR id (WS id)* WS*;
header          : HDR (WS | SYMBOL | CHAR)*;

// Lexer rules
ESCAPE      : '\\(' | '\\)' | '\\"' | '\\:' | '\\-' | '\\*' | '\\#';
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
SYMBOL      : ~('\n' | '"' | ':' | ')' | '(' | '-' | '*') | ESCAPE;

