"use strict";(self.webpackChunk_JUPYTERLAB_CORE_OUTPUT=self.webpackChunk_JUPYTERLAB_CORE_OUTPUT||[]).push([[9621],{28718:(e,r,o)=>{o.d(r,{Z:()=>s});var n=o(20559),c=o.n(n),t=o(93476),a=o.n(t)()(c());a.push([e.id,"/*\n\n    Name:       Base16 Default Light\n    Author:     Chris Kempson (http://chriskempson.com)\n\n    CodeMirror template by Jan T. Sott (https://github.com/idleberg/base16-codemirror)\n    Original Base16 color scheme by Chris Kempson (https://github.com/chriskempson/base16)\n\n*/\n\n.cm-s-base16-light.CodeMirror { background: #f5f5f5; color: #202020; }\n.cm-s-base16-light div.CodeMirror-selected { background: #e0e0e0; }\n.cm-s-base16-light .CodeMirror-line::selection, .cm-s-base16-light .CodeMirror-line > span::selection, .cm-s-base16-light .CodeMirror-line > span > span::selection { background: #e0e0e0; }\n.cm-s-base16-light .CodeMirror-line::-moz-selection, .cm-s-base16-light .CodeMirror-line > span::-moz-selection, .cm-s-base16-light .CodeMirror-line > span > span::-moz-selection { background: #e0e0e0; }\n.cm-s-base16-light .CodeMirror-gutters { background: #f5f5f5; border-right: 0px; }\n.cm-s-base16-light .CodeMirror-guttermarker { color: #ac4142; }\n.cm-s-base16-light .CodeMirror-guttermarker-subtle { color: #b0b0b0; }\n.cm-s-base16-light .CodeMirror-linenumber { color: #b0b0b0; }\n.cm-s-base16-light .CodeMirror-cursor { border-left: 1px solid #505050; }\n\n.cm-s-base16-light span.cm-comment { color: #8f5536; }\n.cm-s-base16-light span.cm-atom { color: #aa759f; }\n.cm-s-base16-light span.cm-number { color: #aa759f; }\n\n.cm-s-base16-light span.cm-property, .cm-s-base16-light span.cm-attribute { color: #90a959; }\n.cm-s-base16-light span.cm-keyword { color: #ac4142; }\n.cm-s-base16-light span.cm-string { color: #f4bf75; }\n\n.cm-s-base16-light span.cm-variable { color: #90a959; }\n.cm-s-base16-light span.cm-variable-2 { color: #6a9fb5; }\n.cm-s-base16-light span.cm-def { color: #d28445; }\n.cm-s-base16-light span.cm-bracket { color: #202020; }\n.cm-s-base16-light span.cm-tag { color: #ac4142; }\n.cm-s-base16-light span.cm-link { color: #aa759f; }\n.cm-s-base16-light span.cm-error { background: #ac4142; color: #505050; }\n\n.cm-s-base16-light .CodeMirror-activeline-background { background: #DDDCDC; }\n.cm-s-base16-light .CodeMirror-matchingbracket { color: #f5f5f5 !important; background-color: #6A9FB5 !important}\n","",{version:3,sources:["webpack://./../node_modules/codemirror/theme/base16-light.css"],names:[],mappings:"AAAA;;;;;;;;CAQC;;AAED,gCAAgC,mBAAmB,EAAE,cAAc,EAAE;AACrE,6CAA6C,mBAAmB,EAAE;AAClE,sKAAsK,mBAAmB,EAAE;AAC3L,qLAAqL,mBAAmB,EAAE;AAC1M,yCAAyC,mBAAmB,EAAE,iBAAiB,EAAE;AACjF,8CAA8C,cAAc,EAAE;AAC9D,qDAAqD,cAAc,EAAE;AACrE,4CAA4C,cAAc,EAAE;AAC5D,wCAAwC,8BAA8B,EAAE;;AAExE,qCAAqC,cAAc,EAAE;AACrD,kCAAkC,cAAc,EAAE;AAClD,oCAAoC,cAAc,EAAE;;AAEpD,4EAA4E,cAAc,EAAE;AAC5F,qCAAqC,cAAc,EAAE;AACrD,oCAAoC,cAAc,EAAE;;AAEpD,sCAAsC,cAAc,EAAE;AACtD,wCAAwC,cAAc,EAAE;AACxD,iCAAiC,cAAc,EAAE;AACjD,qCAAqC,cAAc,EAAE;AACrD,iCAAiC,cAAc,EAAE;AACjD,kCAAkC,cAAc,EAAE;AAClD,mCAAmC,mBAAmB,EAAE,cAAc,EAAE;;AAExE,uDAAuD,mBAAmB,EAAE;AAC5E,iDAAiD,yBAAyB,EAAE,oCAAoC",sourcesContent:["/*\n\n    Name:       Base16 Default Light\n    Author:     Chris Kempson (http://chriskempson.com)\n\n    CodeMirror template by Jan T. Sott (https://github.com/idleberg/base16-codemirror)\n    Original Base16 color scheme by Chris Kempson (https://github.com/chriskempson/base16)\n\n*/\n\n.cm-s-base16-light.CodeMirror { background: #f5f5f5; color: #202020; }\n.cm-s-base16-light div.CodeMirror-selected { background: #e0e0e0; }\n.cm-s-base16-light .CodeMirror-line::selection, .cm-s-base16-light .CodeMirror-line > span::selection, .cm-s-base16-light .CodeMirror-line > span > span::selection { background: #e0e0e0; }\n.cm-s-base16-light .CodeMirror-line::-moz-selection, .cm-s-base16-light .CodeMirror-line > span::-moz-selection, .cm-s-base16-light .CodeMirror-line > span > span::-moz-selection { background: #e0e0e0; }\n.cm-s-base16-light .CodeMirror-gutters { background: #f5f5f5; border-right: 0px; }\n.cm-s-base16-light .CodeMirror-guttermarker { color: #ac4142; }\n.cm-s-base16-light .CodeMirror-guttermarker-subtle { color: #b0b0b0; }\n.cm-s-base16-light .CodeMirror-linenumber { color: #b0b0b0; }\n.cm-s-base16-light .CodeMirror-cursor { border-left: 1px solid #505050; }\n\n.cm-s-base16-light span.cm-comment { color: #8f5536; }\n.cm-s-base16-light span.cm-atom { color: #aa759f; }\n.cm-s-base16-light span.cm-number { color: #aa759f; }\n\n.cm-s-base16-light span.cm-property, .cm-s-base16-light span.cm-attribute { color: #90a959; }\n.cm-s-base16-light span.cm-keyword { color: #ac4142; }\n.cm-s-base16-light span.cm-string { color: #f4bf75; }\n\n.cm-s-base16-light span.cm-variable { color: #90a959; }\n.cm-s-base16-light span.cm-variable-2 { color: #6a9fb5; }\n.cm-s-base16-light span.cm-def { color: #d28445; }\n.cm-s-base16-light span.cm-bracket { color: #202020; }\n.cm-s-base16-light span.cm-tag { color: #ac4142; }\n.cm-s-base16-light span.cm-link { color: #aa759f; }\n.cm-s-base16-light span.cm-error { background: #ac4142; color: #505050; }\n\n.cm-s-base16-light .CodeMirror-activeline-background { background: #DDDCDC; }\n.cm-s-base16-light .CodeMirror-matchingbracket { color: #f5f5f5 !important; background-color: #6A9FB5 !important}\n"],sourceRoot:""}]);const s=a},93476:e=>{e.exports=function(e){var r=[];return r.toString=function(){return this.map((function(r){var o="",n=void 0!==r[5];return r[4]&&(o+="@supports (".concat(r[4],") {")),r[2]&&(o+="@media ".concat(r[2]," {")),n&&(o+="@layer".concat(r[5].length>0?" ".concat(r[5]):""," {")),o+=e(r),n&&(o+="}"),r[2]&&(o+="}"),r[4]&&(o+="}"),o})).join("")},r.i=function(e,o,n,c,t){"string"==typeof e&&(e=[[null,e,void 0]]);var a={};if(n)for(var s=0;s<this.length;s++){var i=this[s][0];null!=i&&(a[i]=!0)}for(var A=0;A<e.length;A++){var l=[].concat(e[A]);n&&a[l[0]]||(void 0!==t&&(void 0===l[5]||(l[1]="@layer".concat(l[5].length>0?" ".concat(l[5]):""," {").concat(l[1],"}")),l[5]=t),o&&(l[2]?(l[1]="@media ".concat(l[2]," {").concat(l[1],"}"),l[2]=o):l[2]=o),c&&(l[4]?(l[1]="@supports (".concat(l[4],") {").concat(l[1],"}"),l[4]=c):l[4]="".concat(c)),r.push(l))}},r}},20559:e=>{e.exports=function(e){var r=e[1],o=e[3];if(!o)return r;if("function"==typeof btoa){var n=btoa(unescape(encodeURIComponent(JSON.stringify(o)))),c="sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(n),t="/*# ".concat(c," */"),a=o.sources.map((function(e){return"/*# sourceURL=".concat(o.sourceRoot||"").concat(e," */")}));return[r].concat(a).concat([t]).join("\n")}return[r].join("\n")}},59621:(e,r,o)=>{o.r(r),o.d(r,{default:()=>g});var n=o(1892),c=o.n(n),t=o(95760),a=o.n(t),s=o(38311),i=o.n(s),A=o(58192),l=o.n(A),m=o(38060),b=o.n(m),p=o(54865),u=o.n(p),d=o(28718),h={};h.styleTagTransform=u(),h.setAttributes=l(),h.insert=i().bind(null,"head"),h.domAPI=a(),h.insertStyleElement=b(),c()(d.Z,h);const g=d.Z&&d.Z.locals?d.Z.locals:void 0},1892:e=>{var r=[];function o(e){for(var o=-1,n=0;n<r.length;n++)if(r[n].identifier===e){o=n;break}return o}function n(e,n){for(var t={},a=[],s=0;s<e.length;s++){var i=e[s],A=n.base?i[0]+n.base:i[0],l=t[A]||0,m="".concat(A," ").concat(l);t[A]=l+1;var b=o(m),p={css:i[1],media:i[2],sourceMap:i[3],supports:i[4],layer:i[5]};if(-1!==b)r[b].references++,r[b].updater(p);else{var u=c(p,n);n.byIndex=s,r.splice(s,0,{identifier:m,updater:u,references:1})}a.push(m)}return a}function c(e,r){var o=r.domAPI(r);return o.update(e),function(r){if(r){if(r.css===e.css&&r.media===e.media&&r.sourceMap===e.sourceMap&&r.supports===e.supports&&r.layer===e.layer)return;o.update(e=r)}else o.remove()}}e.exports=function(e,c){var t=n(e=e||[],c=c||{});return function(e){e=e||[];for(var a=0;a<t.length;a++){var s=o(t[a]);r[s].references--}for(var i=n(e,c),A=0;A<t.length;A++){var l=o(t[A]);0===r[l].references&&(r[l].updater(),r.splice(l,1))}t=i}}},38311:e=>{var r={};e.exports=function(e,o){var n=function(e){if(void 0===r[e]){var o=document.querySelector(e);if(window.HTMLIFrameElement&&o instanceof window.HTMLIFrameElement)try{o=o.contentDocument.head}catch(e){o=null}r[e]=o}return r[e]}(e);if(!n)throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");n.appendChild(o)}},38060:e=>{e.exports=function(e){var r=document.createElement("style");return e.setAttributes(r,e.attributes),e.insert(r,e.options),r}},58192:(e,r,o)=>{e.exports=function(e){var r=o.nc;r&&e.setAttribute("nonce",r)}},95760:e=>{e.exports=function(e){var r=e.insertStyleElement(e);return{update:function(o){!function(e,r,o){var n="";o.supports&&(n+="@supports (".concat(o.supports,") {")),o.media&&(n+="@media ".concat(o.media," {"));var c=void 0!==o.layer;c&&(n+="@layer".concat(o.layer.length>0?" ".concat(o.layer):""," {")),n+=o.css,c&&(n+="}"),o.media&&(n+="}"),o.supports&&(n+="}");var t=o.sourceMap;t&&"undefined"!=typeof btoa&&(n+="\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(t))))," */")),r.styleTagTransform(n,e,r.options)}(r,e,o)},remove:function(){!function(e){if(null===e.parentNode)return!1;e.parentNode.removeChild(e)}(r)}}}},54865:e=>{e.exports=function(e,r){if(r.styleSheet)r.styleSheet.cssText=e;else{for(;r.firstChild;)r.removeChild(r.firstChild);r.appendChild(document.createTextNode(e))}}}}]);
//# sourceMappingURL=9621.7698d7d.js.map