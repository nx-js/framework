'use strict'

const style = document.createElement('style')
const cloak = document.createTextNode('[cloak] { display: none; }')
style.appendChild(cloak)
document.head.appendChild(style)
