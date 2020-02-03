const remote = require('electron').remote;

/* Opens a modal window for user interaction. callback(cbParams) is called upon closing the window. */
module.exports = {
  launchModal: (url, w, h, callback) => {
    // Open a new window to do this
    let win = new remote.BrowserWindow({
      width: w,
      height: h,
      parent: remote.getCurrentWindow(),
      // modal: true,
      webPreferences: {
              nodeIntegration: true
          },
    });
    win.setMenu(null);
    win.on('closed', () => {
      win = null;

      // Continue
      callback();
    });
    win.webContents.on('did-finish-load', ()=>{
     win.show();
     win.focus();
    });

    // win.webContents.openDevTools();
    win.loadURL(url);
  }
}
