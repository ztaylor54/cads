/********** MATERIAL UI INSTANTIATIONS **********/
import {MDCTabBar} from '@material/tab-bar';
import {MDCRipple} from '@material/ripple';
import {MDCSnackbar} from '@material/snackbar';
import { saveAs } from 'file-saver';
const remote = window.require('electron').remote;

// Set window title
var pjson = require('../package.json');
window.document.title = "CADS v" + pjson.version;

// Instantiate snackbar
const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'));
const snackbar_label = document.querySelector('.mdc-snackbar__label');

const buttonRipple = new MDCRipple(document.querySelector('.mdc-button'));

const mdc = require('material-components-web');
const tabBar = new MDCTabBar(document.querySelector('.mdc-tab-bar'));

// Instantiate MDC Drawer
const drawerEl = document.querySelector('.mdc-drawer');
const drawer = new mdc.drawer.MDCDrawer.attachTo(drawerEl);

// Instantiate MDC Top App Bar (required)
const topAppBarEl = document.querySelector('.mdc-top-app-bar');
const topAppBar = new mdc.topAppBar.MDCTopAppBar.attachTo(topAppBarEl);

topAppBar.setScrollTarget(document.querySelector('.main-content'));
topAppBar.listen('MDCTopAppBar:nav', () => {
  drawer.open = !drawer.open;
});

const listEl = document.querySelector('.mdc-drawer .mdc-list');
const mainContentEl = document.querySelector('.main-content');

listEl.addEventListener('click', (event) => {
  drawer.open = false;
});

// Nav drawer listeners
const navSaveEl = document.querySelector('.nav-action-save');
navSaveEl.addEventListener('click', (event) => {
  const tempFile = remote.getGlobal('shared').tempFileLoc;
  if (!tempFile) {
    // Alert no file to save
    snackbar_label.innerHTML = "No file to save, try loading a die study first.";
    snackbar.open();
  }
  else {
    fs.readFile(tempFile, 'utf8', function(err, data) {
      if (err) {
        return console.log(err);

        snackbar_label.innerHTML = "Unable to save file. Please try again.";
        snackbar.open();
      }

      // Save permanently
      var blob = new Blob([data], {type: "text/javascript"});
      saveAs(blob, "filename.json");
    });
  }
});

import {MDCTextField} from '@material/textfield';

// const textField = new MDCTextField(document.querySelector('.mdc-text-field'));
