"use strict";(self.webpackChunk_JUPYTERLAB_CORE_OUTPUT=self.webpackChunk_JUPYTERLAB_CORE_OUTPUT||[]).push([[406],{55036:(r,e,n)=>{n.d(e,{Z:()=>t});var a=n(20559),c=n.n(a),o=n(93476),s=n.n(o)()(c());s.push([r.id,".cm-s-erlang-dark.CodeMirror { background: #002240; color: white; }\n.cm-s-erlang-dark div.CodeMirror-selected { background: #b36539; }\n.cm-s-erlang-dark .CodeMirror-line::selection, .cm-s-erlang-dark .CodeMirror-line > span::selection, .cm-s-erlang-dark .CodeMirror-line > span > span::selection { background: rgba(179, 101, 57, .99); }\n.cm-s-erlang-dark .CodeMirror-line::-moz-selection, .cm-s-erlang-dark .CodeMirror-line > span::-moz-selection, .cm-s-erlang-dark .CodeMirror-line > span > span::-moz-selection { background: rgba(179, 101, 57, .99); }\n.cm-s-erlang-dark .CodeMirror-gutters { background: #002240; border-right: 1px solid #aaa; }\n.cm-s-erlang-dark .CodeMirror-guttermarker { color: white; }\n.cm-s-erlang-dark .CodeMirror-guttermarker-subtle { color: #d0d0d0; }\n.cm-s-erlang-dark .CodeMirror-linenumber { color: #d0d0d0; }\n.cm-s-erlang-dark .CodeMirror-cursor { border-left: 1px solid white; }\n\n.cm-s-erlang-dark span.cm-quote      { color: #ccc; }\n.cm-s-erlang-dark span.cm-atom       { color: #f133f1; }\n.cm-s-erlang-dark span.cm-attribute  { color: #ff80e1; }\n.cm-s-erlang-dark span.cm-bracket    { color: #ff9d00; }\n.cm-s-erlang-dark span.cm-builtin    { color: #eaa; }\n.cm-s-erlang-dark span.cm-comment    { color: #77f; }\n.cm-s-erlang-dark span.cm-def        { color: #e7a; }\n.cm-s-erlang-dark span.cm-keyword    { color: #ffee80; }\n.cm-s-erlang-dark span.cm-meta       { color: #50fefe; }\n.cm-s-erlang-dark span.cm-number     { color: #ffd0d0; }\n.cm-s-erlang-dark span.cm-operator   { color: #d55; }\n.cm-s-erlang-dark span.cm-property   { color: #ccc; }\n.cm-s-erlang-dark span.cm-qualifier  { color: #ccc; }\n.cm-s-erlang-dark span.cm-special    { color: #ffbbbb; }\n.cm-s-erlang-dark span.cm-string     { color: #3ad900; }\n.cm-s-erlang-dark span.cm-string-2   { color: #ccc; }\n.cm-s-erlang-dark span.cm-tag        { color: #9effff; }\n.cm-s-erlang-dark span.cm-variable   { color: #50fe50; }\n.cm-s-erlang-dark span.cm-variable-2 { color: #e0e; }\n.cm-s-erlang-dark span.cm-variable-3, .cm-s-erlang-dark span.cm-type { color: #ccc; }\n.cm-s-erlang-dark span.cm-error      { color: #9d1e15; }\n\n.cm-s-erlang-dark .CodeMirror-activeline-background { background: #013461; }\n.cm-s-erlang-dark .CodeMirror-matchingbracket { outline:1px solid grey; color:white !important; }\n","",{version:3,sources:["webpack://./../node_modules/codemirror/theme/erlang-dark.css"],names:[],mappings:"AAAA,+BAA+B,mBAAmB,EAAE,YAAY,EAAE;AAClE,4CAA4C,mBAAmB,EAAE;AACjE,mKAAmK,mCAAmC,EAAE;AACxM,kLAAkL,mCAAmC,EAAE;AACvN,wCAAwC,mBAAmB,EAAE,4BAA4B,EAAE;AAC3F,6CAA6C,YAAY,EAAE;AAC3D,oDAAoD,cAAc,EAAE;AACpE,2CAA2C,cAAc,EAAE;AAC3D,uCAAuC,4BAA4B,EAAE;;AAErE,uCAAuC,WAAW,EAAE;AACpD,uCAAuC,cAAc,EAAE;AACvD,uCAAuC,cAAc,EAAE;AACvD,uCAAuC,cAAc,EAAE;AACvD,uCAAuC,WAAW,EAAE;AACpD,uCAAuC,WAAW,EAAE;AACpD,uCAAuC,WAAW,EAAE;AACpD,uCAAuC,cAAc,EAAE;AACvD,uCAAuC,cAAc,EAAE;AACvD,uCAAuC,cAAc,EAAE;AACvD,uCAAuC,WAAW,EAAE;AACpD,uCAAuC,WAAW,EAAE;AACpD,uCAAuC,WAAW,EAAE;AACpD,uCAAuC,cAAc,EAAE;AACvD,uCAAuC,cAAc,EAAE;AACvD,uCAAuC,WAAW,EAAE;AACpD,uCAAuC,cAAc,EAAE;AACvD,uCAAuC,cAAc,EAAE;AACvD,uCAAuC,WAAW,EAAE;AACpD,uEAAuE,WAAW,EAAE;AACpF,uCAAuC,cAAc,EAAE;;AAEvD,sDAAsD,mBAAmB,EAAE;AAC3E,gDAAgD,sBAAsB,EAAE,sBAAsB,EAAE",sourcesContent:[".cm-s-erlang-dark.CodeMirror { background: #002240; color: white; }\n.cm-s-erlang-dark div.CodeMirror-selected { background: #b36539; }\n.cm-s-erlang-dark .CodeMirror-line::selection, .cm-s-erlang-dark .CodeMirror-line > span::selection, .cm-s-erlang-dark .CodeMirror-line > span > span::selection { background: rgba(179, 101, 57, .99); }\n.cm-s-erlang-dark .CodeMirror-line::-moz-selection, .cm-s-erlang-dark .CodeMirror-line > span::-moz-selection, .cm-s-erlang-dark .CodeMirror-line > span > span::-moz-selection { background: rgba(179, 101, 57, .99); }\n.cm-s-erlang-dark .CodeMirror-gutters { background: #002240; border-right: 1px solid #aaa; }\n.cm-s-erlang-dark .CodeMirror-guttermarker { color: white; }\n.cm-s-erlang-dark .CodeMirror-guttermarker-subtle { color: #d0d0d0; }\n.cm-s-erlang-dark .CodeMirror-linenumber { color: #d0d0d0; }\n.cm-s-erlang-dark .CodeMirror-cursor { border-left: 1px solid white; }\n\n.cm-s-erlang-dark span.cm-quote      { color: #ccc; }\n.cm-s-erlang-dark span.cm-atom       { color: #f133f1; }\n.cm-s-erlang-dark span.cm-attribute  { color: #ff80e1; }\n.cm-s-erlang-dark span.cm-bracket    { color: #ff9d00; }\n.cm-s-erlang-dark span.cm-builtin    { color: #eaa; }\n.cm-s-erlang-dark span.cm-comment    { color: #77f; }\n.cm-s-erlang-dark span.cm-def        { color: #e7a; }\n.cm-s-erlang-dark span.cm-keyword    { color: #ffee80; }\n.cm-s-erlang-dark span.cm-meta       { color: #50fefe; }\n.cm-s-erlang-dark span.cm-number     { color: #ffd0d0; }\n.cm-s-erlang-dark span.cm-operator   { color: #d55; }\n.cm-s-erlang-dark span.cm-property   { color: #ccc; }\n.cm-s-erlang-dark span.cm-qualifier  { color: #ccc; }\n.cm-s-erlang-dark span.cm-special    { color: #ffbbbb; }\n.cm-s-erlang-dark span.cm-string     { color: #3ad900; }\n.cm-s-erlang-dark span.cm-string-2   { color: #ccc; }\n.cm-s-erlang-dark span.cm-tag        { color: #9effff; }\n.cm-s-erlang-dark span.cm-variable   { color: #50fe50; }\n.cm-s-erlang-dark span.cm-variable-2 { color: #e0e; }\n.cm-s-erlang-dark span.cm-variable-3, .cm-s-erlang-dark span.cm-type { color: #ccc; }\n.cm-s-erlang-dark span.cm-error      { color: #9d1e15; }\n\n.cm-s-erlang-dark .CodeMirror-activeline-background { background: #013461; }\n.cm-s-erlang-dark .CodeMirror-matchingbracket { outline:1px solid grey; color:white !important; }\n"],sourceRoot:""}]);const t=s},93476:r=>{r.exports=function(r){var e=[];return e.toString=function(){return this.map((function(e){var n="",a=void 0!==e[5];return e[4]&&(n+="@supports (".concat(e[4],") {")),e[2]&&(n+="@media ".concat(e[2]," {")),a&&(n+="@layer".concat(e[5].length>0?" ".concat(e[5]):""," {")),n+=r(e),a&&(n+="}"),e[2]&&(n+="}"),e[4]&&(n+="}"),n})).join("")},e.i=function(r,n,a,c,o){"string"==typeof r&&(r=[[null,r,void 0]]);var s={};if(a)for(var t=0;t<this.length;t++){var A=this[t][0];null!=A&&(s[A]=!0)}for(var l=0;l<r.length;l++){var d=[].concat(r[l]);a&&s[d[0]]||(void 0!==o&&(void 0===d[5]||(d[1]="@layer".concat(d[5].length>0?" ".concat(d[5]):""," {").concat(d[1],"}")),d[5]=o),n&&(d[2]?(d[1]="@media ".concat(d[2]," {").concat(d[1],"}"),d[2]=n):d[2]=n),c&&(d[4]?(d[1]="@supports (".concat(d[4],") {").concat(d[1],"}"),d[4]=c):d[4]="".concat(c)),e.push(d))}},e}},20559:r=>{r.exports=function(r){var e=r[1],n=r[3];if(!n)return e;if("function"==typeof btoa){var a=btoa(unescape(encodeURIComponent(JSON.stringify(n)))),c="sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(a),o="/*# ".concat(c," */"),s=n.sources.map((function(r){return"/*# sourceURL=".concat(n.sourceRoot||"").concat(r," */")}));return[e].concat(s).concat([o]).join("\n")}return[e].join("\n")}},20406:(r,e,n)=>{n.r(e),n.d(e,{default:()=>f});var a=n(1892),c=n.n(a),o=n(95760),s=n.n(o),t=n(38311),A=n.n(t),l=n(58192),d=n.n(l),i=n(38060),m=n.n(i),u=n(54865),p=n.n(u),g=n(55036),C={};C.styleTagTransform=p(),C.setAttributes=d(),C.insert=A().bind(null,"head"),C.domAPI=s(),C.insertStyleElement=m(),c()(g.Z,C);const f=g.Z&&g.Z.locals?g.Z.locals:void 0},1892:r=>{var e=[];function n(r){for(var n=-1,a=0;a<e.length;a++)if(e[a].identifier===r){n=a;break}return n}function a(r,a){for(var o={},s=[],t=0;t<r.length;t++){var A=r[t],l=a.base?A[0]+a.base:A[0],d=o[l]||0,i="".concat(l," ").concat(d);o[l]=d+1;var m=n(i),u={css:A[1],media:A[2],sourceMap:A[3],supports:A[4],layer:A[5]};if(-1!==m)e[m].references++,e[m].updater(u);else{var p=c(u,a);a.byIndex=t,e.splice(t,0,{identifier:i,updater:p,references:1})}s.push(i)}return s}function c(r,e){var n=e.domAPI(e);return n.update(r),function(e){if(e){if(e.css===r.css&&e.media===r.media&&e.sourceMap===r.sourceMap&&e.supports===r.supports&&e.layer===r.layer)return;n.update(r=e)}else n.remove()}}r.exports=function(r,c){var o=a(r=r||[],c=c||{});return function(r){r=r||[];for(var s=0;s<o.length;s++){var t=n(o[s]);e[t].references--}for(var A=a(r,c),l=0;l<o.length;l++){var d=n(o[l]);0===e[d].references&&(e[d].updater(),e.splice(d,1))}o=A}}},38311:r=>{var e={};r.exports=function(r,n){var a=function(r){if(void 0===e[r]){var n=document.querySelector(r);if(window.HTMLIFrameElement&&n instanceof window.HTMLIFrameElement)try{n=n.contentDocument.head}catch(r){n=null}e[r]=n}return e[r]}(r);if(!a)throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");a.appendChild(n)}},38060:r=>{r.exports=function(r){var e=document.createElement("style");return r.setAttributes(e,r.attributes),r.insert(e,r.options),e}},58192:(r,e,n)=>{r.exports=function(r){var e=n.nc;e&&r.setAttribute("nonce",e)}},95760:r=>{r.exports=function(r){var e=r.insertStyleElement(r);return{update:function(n){!function(r,e,n){var a="";n.supports&&(a+="@supports (".concat(n.supports,") {")),n.media&&(a+="@media ".concat(n.media," {"));var c=void 0!==n.layer;c&&(a+="@layer".concat(n.layer.length>0?" ".concat(n.layer):""," {")),a+=n.css,c&&(a+="}"),n.media&&(a+="}"),n.supports&&(a+="}");var o=n.sourceMap;o&&"undefined"!=typeof btoa&&(a+="\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(o))))," */")),e.styleTagTransform(a,r,e.options)}(e,r,n)},remove:function(){!function(r){if(null===r.parentNode)return!1;r.parentNode.removeChild(r)}(e)}}}},54865:r=>{r.exports=function(r,e){if(e.styleSheet)e.styleSheet.cssText=r;else{for(;e.firstChild;)e.removeChild(e.firstChild);e.appendChild(document.createTextNode(r))}}}}]);
//# sourceMappingURL=406.fc80499.js.map