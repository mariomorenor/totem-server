/**
* @type {import('electron-builder').Configuration}
* @see https://www.electron.build/configuration/configuration
*/
module.exports = {
    "appId": "com.jmoreno.totemserver",
    "win": {
        "target": "nsis",
        "icon":"build/icons/icon.png"
    },
    "publish": ["github"]
}