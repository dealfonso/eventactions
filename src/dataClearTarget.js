DEFAULT_OPTIONS_CLEAR_TARGET = {
    // Default options can be defined here if needed
    targetSelector: null,
    // The method to clear the content of the target elements
    clearContentMethod: 'innerHTML',
    // The content to set when clearing
    clearContentValue: '',
};

function snakeToCamelCase(str) {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

function camelToSnakeCase(str) {
    return str.replace(/[A-Z]/g, (g) => `_${g[0].toLowerCase()}`);
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
 */
function getElementOptions(el, defaultOptions, prefix) {
    const options = { ...defaultOptions };

    const prefixStr = prefix ? `${prefix}-` : '';
    for (const option of Object.keys(options)) {
        const attributeName = prefixStr + camelToSnakeCase(option);
        const attributeValue = el.dataset[attributeName] || el.getAttribute(`data-${attributeName}`);
        if (attributeValue !== null && attributeValue !== undefined) {
            // Convert the value to the appropriate type if necessary
            if (typeof options[option] === 'boolean') {
                options[option] = attributeValue.toLowerCase() === 'true';
            } else if (typeof options[option] === 'number') {
                options[option] = parseFloat(attributeValue);
            } else {
                options[option] = attributeValue;
            }
        }
    }

    // Convert keys to camelCase if needed
    return options;
}
/**
 * This function sets up a click event listener on the specified element
 * that clears the content of the target elements specified by the
 * data-clear-target attribute.
 * 
 * If no target selector is provided, it defaults to the element itself.
 * 
 * @param {HTMLElement} el - The element to which the clear target functionality is applied.
 * @returns {void}
 */
function makeClearTarget(el, options = {}) {
    if (!el || !el.getAttribute) {
        console.error('Invalid element provided to makeClearTarget');
        return;
    }

    // Get the options for the element, merging with default options (bf if for the name of the library: button-functions)
    options = getElementOptions(el, DEFAULT_OPTIONS_CLEAR_TARGET, 'bf');

    const clearTarget_handler = function() {
        const targetSelector = this.getAttribute('data-clear-target');
        let targetElements = [];
        if (!targetSelector) {
            targetElements = [el];
        } else {
            targetElements = document.querySelectorAll(targetSelector);
        }

        if (targetElements.length === 0) {
            console.warn(`No elements found for selector: ${targetSelector}`);
            return;
        }

        const clearContentMethod = this.getAttribute('data-clear-content-method') || 'innerHTML';
        if (!['innerHTML', 'textContent'].includes(clearContentMethod)) {
            console.warn(`Invalid clear method: ${clearContentMethod}`);
            return;
        }

        // Get the content to set when clearing
        // If no content value is provided, default to an empty string
        // This can be customized by setting the data-clear-content-value attribute
        const clearContentValue = this.getAttribute('data-clear-content-value') || '';
        for (const targetElement of targetElements) {
            targetElement[clearContentMethod] = clearContentValue;
        }
    }

    // Check if the element already has a _bf property
    // and if it has a clearTarget_handler, remove it before adding a new one
    if (!el._bf) {
        el._bf = {};
    }
    if (el._bf.clearTarget_handler || null) {
        el.removeEventListener('click', el._bf.clearTarget_handler);
    }
    el._bf.clearTarget_handler = clearTarget_handler;

    // Add the click event listener to the element
    el.addEventListener('click', clearTarget_handler);
}

document.querySelectorAll('[data-clear-target]').forEach(button => {
    makeClearTarget(button);
});