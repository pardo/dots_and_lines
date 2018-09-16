parcelRequire=function(e,r,n,t){var i="function"==typeof parcelRequire&&parcelRequire,o="function"==typeof require&&require;function u(n,t){if(!r[n]){if(!e[n]){var f="function"==typeof parcelRequire&&parcelRequire;if(!t&&f)return f(n,!0);if(i)return i(n,!0);if(o&&"string"==typeof n)return o(n);var c=new Error("Cannot find module '"+n+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[n][1][r]||r};var l=r[n]=new u.Module(n);e[n][0].call(l.exports,p,l,l.exports,this)}return r[n].exports;function p(e){return u(p.resolve(e))}}u.isParcelRequire=!0,u.Module=function(e){this.id=e,this.bundle=u,this.exports={}},u.modules=e,u.cache=r,u.parent=i,u.register=function(r,n){e[r]=[function(e,r){r.exports=n},{}]};for(var f=0;f<n.length;f++)u(n[f]);if(n.length){var c=u(n[n.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=c:"function"==typeof define&&define.amd?define(function(){return c}):t&&(this[t]=c)}return u}({"yuMI":[function(require,module,exports) {

},{}],"K8rx":[function(require,module,exports) {
"use strict";function e(){this.initialize=function(e){this.container=e,this.size={width:6,height:6},this.serializedHistory=[],this.currentPlayer="blue",this.points={blue:0,red:0},this.connectedPoints={},this.completedBlocks={},this.currentPlayerElement=null,this.otherPlayerElement=null,this.createDom(),this.pushToHistory()},this.checkEnd=function(){this.points.red+this.points.blue===this.size.width*this.size.height&&(this.points.red>this.points.blue?window.alert("Red Player Won"):this.points.red<this.points.blue?window.alert("Blue Player Won"):window.alert("No winners"))},this.isSquareComplete=function(e,t){var i=e+"-"+t,s=e+1+"-"+t,n=e+"-"+(t+1),r=e+1+"-"+(t+1);return this.connectedPoints[i+"-"+s]&&this.connectedPoints[i+"-"+n]&&this.connectedPoints[n+"-"+r]&&this.connectedPoints[s+"-"+r]},this.checkAndMark=function(e,t,i){var s=!1;return!this.completedBlocks[e+"-"+t]&&this.isSquareComplete(e,t)&&(s=!0,this.completedBlocks[e+"-"+t]=i,this.markBlockAsActive(e,t,i)),s},this.connectPoints=function(e,t,i,s,n){var r=e+"-"+t,c=i+"-"+s;if(this.connectedPoints[r+"-"+c])return!1;this.markLineAsActive(e,t,i,s,n),this.connectedPoints[r+"-"+c]=n;var a=0;return a+=this.checkAndMark(e,t,n)?1:0,a+=this.checkAndMark(e-1,t,n)?1:0,(a+=this.checkAndMark(e,t-1,n)?1:0)>0?(this.points[this.currentPlayer]+=a,this.updateCurrentPlayer(this.currentPlayer),this.checkEnd()):this.switchCurrentPlayer(this.currentPlayer),!0},this.pushToHistory=function(){this.serializedHistory.push(JSON.stringify(this.serialize()))},this.popFromHistory=function(){var e=this.serializedHistory.pop();void 0!==e&&this.unserialize(JSON.parse(e))},this.onClickLine=function(e,t,i,s){this.pushToHistory(),this.connectPoints(e,t,i,s,this.currentPlayer)||this.serializedHistory.pop()},this.switchCurrentPlayer=function(e){this.currentPlayer="blue"===e?"red":"blue",this.updateCurrentPlayer(this.currentPlayer)},this.markBlockAsActive=function(e,t,i){this.markBlockAs(e,t,!0,i)},this.markBlockAs=function(e,t,i,s){var n=document.getElementById("block-"+e+"-"+t);n&&(n.classList.remove("active"),n.classList.remove("blue"),n.classList.remove("red"),i&&n.classList.add("active"),s&&n.classList.add(s))},this.markLineAsActive=function(e,t,i,s,n){this.markLineAs(e,t,i,s,!0,n)},this.markLineAs=function(e,t,i,s,n,r){var c=document.getElementById("line-"+e+"-"+t+"-"+i+"-"+s);c&&(c.classList.remove("active"),c.classList.remove("blue"),c.classList.remove("red"),n&&c.classList.add("active"),r&&c.classList.add(r))},this.createDotElement=function(e){var t=document.createElement("div");return t.className="dot",e.appendChild(t),t},this.createLineElement=function(e,t,i,s){var n=this,r=document.createElement("div");r.className=t?"v-line line":"h-line line";var c=[i,s],a=t?[i,s+1]:[i+1,s];return r.id="line-"+c[0]+"-"+c[1]+"-"+a[0]+"-"+a[1],r.addEventListener("click",function(e){n.onClickLine(c[0],c[1],a[0],a[1],n.currentPlayer)}),e.appendChild(r),r},this.createHorizontalLineElement=function(e,t,i){return this.createLineElement(e,!1,t,i)},this.createVerticalLineElement=function(e,t,i){return this.createLineElement(e,!0,t,i)},this.createBlockElement=function(e,t,i){var s=document.createElement("div");return s.className="block",s.id="block-"+t+"-"+i,e.appendChild(s),s},this.createRowElement=function(e){var t=document.createElement("div");return t.className="row",e.appendChild(t),t},this.createRowDotLine=function(e,t){for(var i=this.createRowElement(e),s=0;s<this.size.width;s++)this.createDotElement(i,s,t),this.createHorizontalLineElement(i,s,t);this.createDotElement(i,this.size.width,t)},this.createLineBlockRow=function(e,t){for(var i=this.createRowElement(e),s=0;s<this.size.width;s++)this.createVerticalLineElement(i,s,t),this.createBlockElement(i,s,t);this.createVerticalLineElement(i,this.size.width,t)},this.createCurrentPlayerLabel=function(e){var t=this.createRowElement(e),i=document.createElement("div");i.className="current-player",t.appendChild(i),this.currentPlayerElement=i,t=this.createRowElement(e),(i=document.createElement("div")).className="other-player",t.appendChild(i),this.otherPlayerElement=i},this.updateCurrentPlayer=function(e){this.container.classList.remove("red"),this.container.classList.remove("blue"),this.currentPlayerElement.classList.remove("red"),this.currentPlayerElement.classList.remove("blue"),this.otherPlayerElement.classList.remove("red"),this.otherPlayerElement.classList.remove("blue"),"blue"===e?(this.container.classList.add("blue"),this.currentPlayerElement.classList.add("blue"),this.currentPlayerElement.innerText="Blue: "+this.points.blue,this.otherPlayerElement.classList.add("red"),this.otherPlayerElement.innerText="Red: "+this.points.red):(this.container.classList.add("red"),this.currentPlayerElement.classList.add("red"),this.currentPlayerElement.innerText="Red: "+this.points.red,this.otherPlayerElement.classList.add("blue"),this.otherPlayerElement.innerText="Blue: "+this.points.blue)},this.createDom=function(){for(var e=0;e<this.size.height;e++)this.createRowDotLine(this.container,e),this.createLineBlockRow(this.container,e);this.createRowDotLine(this.container,this.size.height),this.createCurrentPlayerLabel(this.container),this.switchCurrentPlayer(this.currentPlayer)},this.serialize=function(){return{currentPlayer:this.currentPlayer,connectedPoints:this.connectedPoints,completedBlocks:this.completedBlocks,points:this.points}},this.unserialize=function(e){this.currentPlayer=e.currentPlayer,this.connectedPoints=e.connectedPoints,this.completedBlocks=e.completedBlocks,this.points=e.points;for(var t=0;t<=this.size.height;t++)for(var i=0;i<=this.size.width;i++){this.completedBlocks[i+"-"+t]?this.markBlockAs(i,t,!0,this.completedBlocks[i+"-"+t]):this.markBlockAs(i,t);var s=this.connectedPoints[i+"-"+t+"-"+(i+1)+"-"+t];s?this.markLineAsActive(i,t,i+1,t,s):this.markLineAs(i,t,i+1,t),(s=this.connectedPoints[i+"-"+t+"-"+i+"-"+(t+1)])?this.markLineAsActive(i,t,i,t+1,s):this.markLineAs(i,t,i,t+1)}this.updateCurrentPlayer(this.currentPlayer)},this.save=function(){window.localStorage.setItem("data",JSON.stringify(this.serialize()))},this.load=function(){this.unserialize(JSON.parse(window.localStorage.getItem("data")))}}Object.defineProperty(exports,"__esModule",{value:!0}),require("./grid.css");var t=new e;window.addEventListener("load",function(){var e=document.getElementById("grid-game");t.initialize(e)}),window.addEventListener("keydown",function(e){switch(e.which){case 85:t.popFromHistory();break;default:console.log(e.which)}}),exports.default=function(){};
},{"./grid.css":"yuMI"}]},{},["K8rx"], null)
//# sourceMappingURL=https://pardo.github.io/dots_and_lines/grid.5020d852.map