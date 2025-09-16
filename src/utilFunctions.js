/**
 * Converts a snake-case string to camelCase.
 * @param {string} str - The snake-case string to convert.
 * @return {string} - The converted camelCase string.
 */
function snakeToCamelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Converts a camelCase string to snake-case.
 *  Starting a number is considered as an uppercase letter (e.g. myVar1Name -> my-var-1-name)
 * @param {string} str - The camelCase string to convert.
 * @return {string} - The converted snake-case string.
 */
function camelToSnakeCase(str) {
    // First consider numbers as a separate word
    str = str.replace(/([0-9]+)/g, (g) => `-${g}`);
    // Then convert camelCase to snake-case
    str = str.replace(/[A-Z]/g, (g) => `-${g[0].toLowerCase()}`);
    // Remove double dashes
    str = str.replace(/--+/g, '-');
    // Remove leading or trailing dashes
    str = str.replace(/^-+/, '').replace(/-+$/, '');
    return str;
}

/**
 * Sanitizes a value by trimming whitespace and converting empty strings to null.
 *  (*) if the value is not a string, it is returned as is.
 * @param {any} value - The value to sanitize.
 * @return {any} - The sanitized value, or null if the input was null, undefined, or an empty string.
 */
function sanitizeValue(value) {
    if (value === null || value === undefined) {
        return null;
    }
    if (typeof value !== 'string') {
        return value;
    }
    value = value.trim();
    if (value === "") {
        return null;
    }
    return value;
}

/**
 * Retrieves the options for an element based on its attributes and a default options object.
 * 
 *   * The options that are going to be retrieved from the element are based on the keys of the default options object. For each
 *   key, the option expected is in the dataset of the element, and a prefix can be added to the attribute name. 
 *   As an example, if the default options object has a key `clearContentMethod`, the expected attribute in the element
 *   would be `data-clear-content-method` if no prefix is provided, or `data-prefix-clear-content-method` if a prefix is provided.
 *   If the attribute is not found, the default value from the default options object is used.
 * 
 *   e.g. if the default options object is:
```js
const defaultOptions = {
    clearContentMethod: 'innerHTML',
    clearContentValue: '',
    clearTargetSelector: null,
};

const options = getElementOptions(el, defaultOptions, 'bf');

// If the element has the attribute `data-bf-clear-content-method="textContent"`
```

Having a html button like:
```html
<button id="myButton" data-bf-clear-content-method="textContent" data-bf-clear-content-value="Hello World" data-bf-clear-target-selector="#myTarget">Clear</button>
```
// The resulting options object will be:
{
    clearContentMethod: 'textContent',
    clearContentValue: 'Hello World',
    clearTargetSelector: '#myTarget',
}

 * @param {HTMLElement} el - The element to retrieve options from.
 * @param {Object} defaultOptions - The default options object.
 * @param {string} prefix - The prefix to use for the data attributes.
 * @param {boolean} onlyExisting - If true, only options that exist in the element's attributes will be included. If false, all options from the default options will be included, using default values where necessary.
 * @return {Object} - The options object with values from the element's attributes or default values.
 */
function getElementOptions(el, defaultOptions, prefix, onlyExisting = false) {
    let options = {};

    const prefixStr = prefix ? `${camelToSnakeCase(prefix)}-` : '';
    for (const option of Object.keys(defaultOptions)) {
        const attributeName = prefixStr + camelToSnakeCase(option);
        const attributeValue = el.dataset[attributeName] || el.getAttribute(`data-${attributeName}`);

        if (attributeValue !== null && attributeValue !== undefined) {
            // Convert the value to the appropriate type if necessary
            if (typeof defaultOptions[option] === 'boolean') {
                options[option] = attributeValue.toLowerCase() === 'true';
            } else if (typeof defaultOptions[option] === 'number') {
                options[option] = parseFloat(attributeValue);
            } else {
                options[option] = attributeValue;
            }
        } else {
            if (!onlyExisting) {
                options[option] = defaultOptions[option];
            }
        }
    }

    // Convert keys to camelCase if needed
    return options;
}

const DEFAULT_MODAL_OPTIONS = {
    title: null,
    body: null,
    btnAcceptText: 'Accept',
    btnCancelText: 'Cancel',
    btnAcceptClass: 'btn-primary',
    btnCancelClass: 'btn-secondary',
    size: 'md', // sm, md, lg, xl, xxl
    centered: true,
    backdrop: 'static', // true, false, 'static'
    keyboard: true,
    focus: true,
    onAccept: null, // function
    onCancel: null, // function
    onShow: null, // function
    onShown: null, // function
    onHide: null, // function
    onHidden: null, // function
    autoShow: true, // if true, the modal is shown immediately after creation
}

function confirmDialog(message, btnAcceptText = 'Accept', btnCancelText = 'Cancel', title = null) {
    const modalDialog = bsCreateModal({
        title: title,
        body: message,
        btnAcceptText: btnAcceptText,
        btnCancelText: btnCancelText,
    });
    if (!modalDialog) {
        return new Promise((resolve, reject) => {
            if (window.confirm(message)) {
                resolve(true);
            } else {
                reject(false);
            }
        });
    }
    return modalDialog;
}

function messageDialog(message, btnAcceptText = 'OK', title = null) {
    const modalDialog = bsCreateModal({
        title: title,
        body: message,
        btnAcceptText: btnAcceptText,
        btnCancelText: null,
    });
    if (!modalDialog) {
        return new Promise((resolve) => {
            window.alert(message);
            resolve(true);
        });
    }
    return modalDialog;
}

function splashDialog(splashContent = '<div class="spinner-border" role="status" aria-hidden="true"></div>', title = null) {
    const modalDialog = bsCreateModal({
        title: title,
        body: splashContent,
        btnAcceptText: null,
        btnCancelText: null,
        backdrop: 'static',
        keyboard: false,
        focus: false,
    });
    return modalDialog;
}

function bsCreateModal(options = {}) {
    if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
        console.warn('bsCreateModal: Bootstrap 5 is required for this function to work.');
        return null;
    }

    options = Object.assign({}, DEFAULT_MODAL_OPTIONS, options || {});

    if (!options.title && !options.body && !options.btnAcceptText && !options.btnCancelText) {
        console.error('bsCreateModal: At least one of title, body, btnAcceptText or btnCancelText must be provided');
        return null;
    }

    if (['sm', 'md', 'lg', 'xl', 'xxl'].indexOf(options.size) === -1) {
        options.size = 'md';
    }
    if (options.size === 'md') {
        options.size = '';
    } else {
        options.size = `modal-${options.size}`;
    }

    if (typeof options.centered !== 'boolean') {
        options.centered = DEFAULT_MODAL_OPTIONS.centered;
    }
    if (options.backdrop !== true && options.backdrop !== false && options.backdrop !== 'static') {
        options.backdrop = DEFAULT_MODAL_OPTIONS.backdrop;
    }
    if (typeof options.keyboard !== 'boolean') {
        options.keyboard = DEFAULT_MODAL_OPTIONS.keyboard;
    }
    if (typeof options.focus !== 'boolean') {
        options.focus = DEFAULT_MODAL_OPTIONS.focus;
    }
    if (options.btnAcceptText !== null && typeof options.btnAcceptText !== 'string') {
        options.btnAcceptText = DEFAULT_MODAL_OPTIONS.btnAcceptText;
    }
    if (options.btnCancelText !== null && typeof options.btnCancelText !== 'string') {
        options.btnCancelText = DEFAULT_MODAL_OPTIONS.btnCancelText;
    }
    if (options.autoShow !== true && options.autoShow !== false) {
        options.autoShow = DEFAULT_MODAL_OPTIONS.autoShow;
    }
    // Sanitize string values
    options.btnAcceptText = sanitizeValue(options.btnAcceptText);
    options.btnCancelText = sanitizeValue(options.btnCancelText);
    options.title = sanitizeValue(options.title);
    options.body = sanitizeValue(options.body);

    if (options.onAccept && typeof options.onAccept !== 'function') {
        options.onAccept = null;
    }
    if (options.onCancel && typeof options.onCancel !== 'function') {
        options.onCancel = null;
    }
    if (options.onShow && typeof options.onShow !== 'function') {
        options.onShow = null;
    }
    if (options.onShown && typeof options.onShown !== 'function') {
        options.onShown = null;
    }
    if (options.onHide && typeof options.onHide !== 'function') {
        options.onHide = null;
    }
    if (options.onHidden && typeof options.onHidden !== 'function') {
        options.onHidden = null;
    }

    // Create the modal HTML structure
    let modalContainer = document.createElement('div');
    modalContainer.innerHTML = `
<div class="modal ${options.size}" tabindex="-1" ${options.backdrop === false ? 'data-bs-backdrop="false"' : (options.backdrop === 'static' ? 'data-bs-backdrop="static"' : '')} ${options.keyboard === false ? 'data-bs-keyboard="false"' : ''} ${options.focus === false ? 'data-bs-focus="false"' : ''}">
  <div class="modal-dialog ${options.centered ? 'modal-dialog-centered' : ''}">
    <div class="modal-content">
      ${options.title===null ? '' : `<div class="modal-header"><h5 class="modal-title">${options.title}</h5></div>`}
      ${options.body===null ? '' : `<div class="modal-body">${options.body}</div>`}
      ${(options.btnAcceptText===null && options.btnCancelText===null) ? '' : `
      <div class="modal-footer">
        ${options.btnCancelText===null ? '' : `<button type="button" class="btn ${options.btnCancelClass}" data-bs-dismiss="modal">${options.btnCancelText}</button>`}
        ${options.btnAcceptText===null ? '' : `<button type="button" class="btn ${options.btnAcceptClass}">${options.btnAcceptText}</button>`}
      </div>`}
    </div>
  </div>
</div>`;
    const acceptButton = modalContainer.querySelector('.btn-primary');
    const cancelButton = modalContainer.querySelector('.btn-secondary');
    const modalElement = modalContainer.querySelector('.modal');

    document.body.appendChild(modalContainer);
    const modal = new bootstrap.Modal(modalElement);

    options = Object.assign({}, DEFAULT_MODAL_OPTIONS, options || {});

    const promise = new Promise((resolve, reject) => {
        // Add event listeners
        if (options.btnAcceptText) {
            acceptButton.addEventListener('click', (e) => {
                if (options.onAccept && typeof options.onAccept === 'function') {
                    options.onAccept(e, modalElement);
                }
                resolve('accept');
                modal.hide();
            }, { once: true });
        }
        if (options.btnCancelText) {
            cancelButton.addEventListener('click', (e) => {
                if (options.onCancel && typeof options.onCancel === 'function') {
                    options.onCancel(e, modalElement);
                }
                reject('cancel');
                modal.hide();
            }, { once: true });
        }
        if (options.keyboard === true) {
            modalElement.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (options.onCancel && typeof options.onCancel === 'function') {
                        options.onCancel(e, modalElement);
                    }
                    reject('cancel');
                    modal.hide();
                }
            }, { once: true });
        }
        if (options.onShow && typeof options.onShow === 'function') {
            modalElement.addEventListener('show.bs.modal', (e) => {
                options.onShow(e, modalElement);
            }, { once: true });
        }
        if (options.onShown && typeof options.onShown === 'function') {
            modalElement.addEventListener('shown.bs.modal', (e) => {
                options.onShown(e, modalElement);
            }, { once: true });
        }
        if (options.onHide && typeof options.onHide === 'function') {
            modalElement.addEventListener('hide.bs.modal', (e) => {
                options.onHide(e, modalElement);
            }, { once: true });
        }
        if (options.onHidden && typeof options.onHidden === 'function') {
            modalElement.addEventListener('hidden.bs.modal', (e) => {
                options.onHidden(e, modalElement);
            }, { once: true });
        }
        // When the modal is hidden, remove focus from any active element to prevent issues with focus on elements behind the modal
        modalElement.addEventListener('hide.bs.modal', function (event) {
            if (document.activeElement) {
                document.activeElement.blur();
            }
        });        

        // When the modal is hidden, remove it from the DOM
        modalElement.addEventListener('hidden.bs.modal', (e) => {
            modal.dispose();
            modalContainer.remove();
        }, { once: true });        
    });

    modal.show();
    promise.modal = modal;
    return promise;
}