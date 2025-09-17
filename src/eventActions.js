if (typeof exports === 'undefined') {
    exports = window;
}

// These are the default options for one action
const DEFAULT_OPTIONS_ACTION = {
    condition: null, // A JavaScript expression that must evaluate to true to continue with the action of the event (i.e. with the rest of the actions); if the condition is not met, the action does not proceed and the rest of the actions are not executed
    conditionAction: null, // A JavaScript expression that must evaluate to true to execute the current action; if the condition is not met, the action is skipped but the rest of the actions continue
    // The difference between condition and conditionAction is that condition stops the execution of all actions if not met, while conditionAction only skips the current action
    
    confirm: null, // A message to show in a confirmation dialog before continuing with the action; if the user cancels, the class does not proceed
    confirmAcceptText: 'OK', // The text for the accept button in the confirmation dialog
    confirmCancelText: 'Cancel', // The text for the cancel button in the confirmation dialog
    execute: null, // A JavaScript expression to execute if the condition is met and the user confirms

    target: null, // The global selector of the target elements (if not set, the element itself is used)
    targetChildren: null, // A selector for the children of the element

    classAdd: null, // The classes to add to the target elements
    classRemove: null, // The classes to remove from the target elements
    classToggle: null, // The classes to toggle on the target elements
    classSet: null, // The classes to set on the target elements (removes all existing classes)

    scrollTo: null, // If set, scrolls the target elements to 'top', 'bottom', 'left' or 'right'

    contentMethod: 'innerHTML', // The method to set the content of the target elements (innerHTML or textContent)
    contentSet: null, // If set, sets the content of the target elements to this value (innerHTML)
    contentAppend: null, // If set, appends this value to the content of the target elements (innerHTML)
    contentPrepend: null, // If set, prepends this value to the content of the target elements (innerHTML)
    contentClear: null, // If set to true, clears the content of the target elements before applying any other content changes

    delay: 0, // The delay in milliseconds before executing this action

    acknowledge: null, // A message to show in an alert dialog after the actions are performed
    acknowledgeButton: 'OK', // The text for the button in the acknowledge dialog

    splash: null, // This will show a splash message while the action is being performed, with the HTML content of this value. It will be hidden when the action is completed.
}

/**
 * Executes the action on the given element with the given options.
 * @param {HTMLElement} el The element to execute the action on.
 * @param {Object} actionOptions The options for the action.
 * @returns {Promise<boolean>} A promise that resolves to true if the action was executed, or false if it was not (due to condition not met or user cancelling).
 */
async function executeAction(el, actionOptions) {
    // We sanitize the options first
    actionOptions = Object.assign({}, EventActions.defaultActionOptions, actionOptions || {});

    // First we are going to get the target elements
    let targetElements = [];
    const targetSelector = sanitizeValue(actionOptions.target || null);
    const targetChildrenSelector = sanitizeValue(actionOptions.targetChildren || null);

    if (targetSelector === null && targetChildrenSelector === null) {
        // If no target selector is provided, we use the button itself as the target
        targetElements = [ el ];
    } else {
        if (targetSelector) {
            // If a target selector is provided, we use it to select the elements
            try {
                targetElements = [ ...targetElements, ...document.querySelectorAll(targetSelector) ];
            } catch (error) {
                console.warn(`Error selecting elements with selector "${targetSelector}"`, error);
            }
        }
        if (targetChildrenSelector) {
            // If a target selector for children is provided, we use it to select the elements
            try {
                targetElements = [ ...targetElements, ...el.querySelectorAll(targetChildrenSelector) ];
            }
            catch (error) {
                console.warn(`Error selecting children with selector "${targetChildrenSelector}"`, error);
            }
        }
    }

    // Let's check if there is a condition to evaluate
    const condition = sanitizeValue(actionOptions.condition || null);

    if (condition) {
        // If a condition is specified, we evaluate it
        if (typeof condition === 'function') {
            result = condition.bind(el)(targetElements);
            if (!result) {
                return false;
            }
            return true;
        }
        try {
            let result = function () {
                return eval(condition);
            }.bind(el)(targetElements);
            if (typeof result === 'function') {
                // If the condition is a function, we call it
                result = result.bind(el)(targetElements);
            }
            if (!result) {
                return false;
            }
        } catch (error) {
            console.error(`Error evaluating condition "${condition}":`, error);
            return false;
        }
    }    

    // Now we check for a local condition (if any)
    const conditionAction = sanitizeValue(actionOptions.conditionAction || null);
    let shouldSkipAction = false;
    if (conditionAction) {
        // If a local condition is specified, we evaluate it
        if (typeof conditionAction === 'function') {
            result = conditionAction.bind(el)(targetElements);
            if (!result) {
                return true; // We skip this action but continue with the rest
            }
        }
        try {
            let result = function () {
                return eval(conditionAction);
            }.bind(el)(targetElements);
            if (typeof result === 'function') {
                // If the condition is a function, we call it
                result = result.bind(el)(targetElements);
            }
            if (!result) {
                shouldSkipAction = true; // We skip this action but continue with the rest
            }
        } catch (error) {
            console.error(`Error evaluating action condition "${conditionAction}":`, error);
            shouldSkipAction = true; // We skip this action but continue with the rest
        }
    }

    if (shouldSkipAction) {
        return true; // We skip this action but continue with the rest
    }

    // Now we should check for confirmation (if any)
    const confirmMessage = sanitizeValue(actionOptions.confirm || null);
    if (confirmMessage) {
        const confirmAcceptText = sanitizeValue(actionOptions.confirmAcceptText || 'OK');
        const confirmCancelText = sanitizeValue(actionOptions.confirmCancelText || 'Cancel');
        try {
            await confirmDialog(confirmMessage, confirmAcceptText, confirmCancelText);
        } catch (error) {
            return false; // User cancelled
        }
    }

    // If there is an action to execute, we do it now
    const execute = sanitizeValue(actionOptions.execute || null);
    if (execute) {
        if (typeof execute === 'function') {
            execute.bind(el)(targetElements);
        } else {
            try {
                let result = function () {
                    return eval(execute);
                }.bind(el)();
                if (typeof result === 'function') {
                    // If the action is a function, we call it
                    result = result.bind(el)(targetElements);
                }
            } catch (error) {
                console.error(`Error executing action "${execute}":`, error);
            }
        }
    }

    // We are adding the classes now
    const classesAdd = sanitizeValue(actionOptions.classAdd || null);
    const classesRemove = sanitizeValue(actionOptions.classRemove || null);
    const classesToggle = sanitizeValue(actionOptions.classToggle || null);
    const classesSet = sanitizeValue(actionOptions.classSet || null);
    
    const classListAdd = classesAdd ? classesAdd.split(/\s+/).filter(cls => cls.trim() !== '') : [];
    const classListRemove = classesRemove ? classesRemove.split(/\s+/).filter(cls => cls.trim() !== '') : [];
    const classListToggle = classesToggle ? classesToggle.split(/\s+/).filter(cls => cls.trim() !== '') : [];
    const classListSet = classesSet ? classesSet.split(/\s+/).filter(cls => cls.trim() !== '') : [];

    // If no classes to set, unset or toggle, we cannot proceed
    // if (classListAdd.length === 0 && classListRemove.length === 0 && classListToggle.length === 0 && classListSet.length === 0) {
    //     return false;
    // }

    // Check if the classes intersect, if so, we cannot proceed
    const intersectionSR = classListAdd.filter(cls => classListRemove.includes(cls));
    const intersectionST = classListAdd.filter(cls => classListToggle.includes(cls));
    const intersectionRT = classListRemove.filter(cls => classListToggle.includes(cls));
    if (intersectionSR.length > 0 || intersectionST.length > 0 || intersectionRT.length > 0) {
        console.warn('Cannot set, unset or toggle the same class at the same time:', {
            classListAdd: classListAdd,
            classListRemove: classListRemove,
            classListToggle: classListToggle
        });
        return false;
    }

    let applyClasses = () => {
        for (const targetElement of targetElements) {
            if (classListSet.length > 0) {
                targetElement.classList.remove(...targetElement.classList); // Remove all existing classes
                classListSet.forEach(cls => {
                    targetElement.classList.add(cls);
                });
                continue; // If we are setting classes, we do not need to add/toggle classes
            }
            if (classListToggle.length > 0) {
                classListToggle.forEach(cls => {
                    targetElement.classList.toggle(cls);
                });
            }
            if (classListAdd.length > 0) {
                classListAdd.forEach(cls => {
                    targetElement.classList.add(cls);
                });
            }
            if (classListRemove.length > 0) {
                classListRemove.forEach(cls => {
                    targetElement.classList.remove(cls);
                });
            }
        }
    };

    const contentMethod = sanitizeValue(actionOptions.contentMethod || 'innerHTML');
    if (!['innerHTML', 'textContent'].includes(contentMethod)) {
        console.warn(`Invalid content method: ${contentMethod}`);
        return;
    }
    const contentSet = sanitizeValue(actionOptions.contentSet || null);
    const contentAppend = sanitizeValue(actionOptions.contentAppend || null);
    const contentPrepend = sanitizeValue(actionOptions.contentPrepend || null);
    const contentClear = actionOptions.contentClear === true || actionOptions.contentClear === 'true' || actionOptions.contentClear === '';

    let applyContentChanges = () => {
        for (const targetElement of targetElements) {
            if (contentClear) {
                targetElement[contentMethod] = '';
            }
            if (contentSet) {
                targetElement[contentMethod] = contentSet;
            }
            if (contentAppend) {
                targetElement[contentMethod] += contentAppend;
            }
            if (contentPrepend) {
                targetElement[contentMethod] = contentPrepend + targetElement[contentMethod];
            }
        }
    }

    const scrollTo = sanitizeValue(actionOptions.scrollTo || null);
    if (scrollTo && !['top', 'bottom', 'left', 'right'].includes(scrollTo)) {
        console.warn(`Invalid scroll-to value: ${scrollTo}`);
        scrollTo = null;
    }
    let applyScroll = () => {
        if (!scrollTo) {
            return;
        }
        for (const targetElement of targetElements) {
            // Scroll the target element into view
            switch (scrollTo) {
                case 'top':
                    targetElement.scrollTop = 0;
                    break;
                case 'bottom':
                    targetElement.scrollTop = targetElement.scrollHeight;
                    break;
                case 'left':
                    targetElement.scrollLeft = 0;
                    break;
                case 'right':
                    targetElement.scrollLeft = targetElement.scrollWidth;
                    break;
            }
            // Only the first target element is scrolled
            break;
        }
    }

    const delay = parseFloat(actionOptions.delay) || 0;
    if (delay > 0 && !isNaN(delay)) {
        // console.log(`Delaying action by ${delay} milliseconds`);
        await new Promise(resolve => setTimeout(resolve, delay) );
    }
    applyClasses();
    applyContentChanges();
    applyScroll();
    // If there is an acknowledge message, we show it now
    const acknowledgeMessage = sanitizeValue(actionOptions.acknowledge || null);
    const acknowledgeButton = sanitizeValue(actionOptions.acknowledgeButton || 'OK');
    if (acknowledgeMessage) {
        await messageDialog(acknowledgeMessage, acknowledgeButton);
    }

    return true;
}

// TODO: remove previous handlers is any (to avoid multiple handlers if the function is called multiple times on the same element)

/**
 * Removes event actions from the given element for the given event type.
 * If eventType is not specified, removes all event actions.
 * @param {HTMLElement} el The element to remove the event actions from.
 * @param {string|null} eventType The event type to remove (default: null, which removes all event types).
 */
function removeEventActions(el, eventType = null) {
    if (!el || !el._eventActions) return;

    // If eventType is not specified, remove all event actions
    if (!eventType) {
        for (const type in el._eventActions) {
            removeEventActions(el, type);
        }
        return;
    }

    if (!el._eventActions[eventType]) return;

    // We remove the event listener
    if (el._eventActions.handlers && el._eventActions.handlers[eventType]) {
        el.removeEventListener(eventType, el._eventActions.handlers[eventType]);
        delete el._eventActions.handlers[eventType];
    }
    
    // We restore the original inline handler (if any)
    if (el._eventActions[eventType]) {
        el[`on${eventType}`] = el._eventActions[eventType];
        delete el._eventActions[eventType];
    } else {
        el[`on${eventType}`] = null;
    }

    // If there are no more handlers, we remove the _eventActions property
    if (el._eventActions.handlers && Object.keys(el._eventActions.handlers).length === 0) {
        delete el._eventActions;
    }
}

/**
 * Adds event actions to the given element for the given event type.
 * @param {HTMLElement} el The element to add the event actions to.
 * @param {string} eventType The event type to listen for (default: 'click').
 * @param {string} prefix The prefix for the data attributes (default: 'ca' for click-action, 'sa' for scroll-action).
 */
function addEventActions(el, eventType = 'click', prefix = 'ca') {
    if (!el) return;
    if (el._eventActions && el._eventActions[eventType]) return; // Already available

    // We store the existing onclick handler (if any) and remove it because we want to make it run after the event actions
    el._eventActions = el._eventActions || {};
    el._eventActions[eventType] = el[`on${eventType}`] || null;
    el[`on${eventType}`] = null;

    function actionHandler(el, prefix) {
        let handler = async function(event) {
            event.preventDefault();
            event.stopPropagation();

            // Check the condition (if any) and execute the action
            let conditionMet = true;
            
            // The spinner (if any)
            let splashDlg = null;

            // We get the options for this element and prefix
            let options = getElementOptions(el, EventActions.defaultActionOptions, prefix, true);
            if (options && Object.keys(options).length > 0) {
                options = Object.assign({}, EventActions.defaultActionOptions, options || {});
                conditionMet = await executeAction(el, options);
                // If a splash message is specified, we show it now
                if (conditionMet && options.splash) {
                    if (splashDlg) {
                        splashDlg.modal.hide();
                        splashDlg = null;
                    }
                    splashDlg = splashDialog(options.splash);
                }
            }

            // Search for suffixed options
            let i = 1;
            while (conditionMet) {
                options = getElementOptions(el, EventActions.defaultActionOptions, `${prefix}-${i}`, true);
                if (options && Object.keys(options).length > 0) {
                    const clearSplash = options.splash === null || options.splash === "" || options.splash === 'false' || options.splash === '0' || options.splash === false;
                    options = Object.assign({}, EventActions.defaultActionOptions, options || {});
                    conditionMet = await executeAction(el, options);
                    if (clearSplash) {
                        if (splashDlg) {
                            splashDlg.modal.hide();
                            splashDlg = null;
                        }
                    }
                    if (conditionMet && options.splash) {
                        if (splashDlg) {
                            splashDlg.modal.hide();
                            splashDlg = null;
                        }
                        splashDlg = splashDialog(options.splash);
                    }
                    i++;
                } else {
                    break;
                }
            }

            if (conditionMet) {
                // Now search the -last action (if any)
                options = getElementOptions(el, EventActions.defaultActionOptions, `${prefix}-last`, true);
                if (options && Object.keys(options).length > 0) {
                    options = Object.assign({}, EventActions.defaultActionOptions, options || {});
                    await executeAction(el, options);

                    if (options.splash === null) {
                        if (splashDlg) {
                            splashDlg.modal.hide();
                            splashDlg = null;
                        }
                    }
                    if (conditionMet && options.splash) {
                        if (splashDlg) {
                            splashDlg.modal.hide();
                            splashDlg = null;
                        }
                        splashDlg = splashDialog(options.splash);
                    }
                }
            }

            // If there is a -finally action, we execute it always
            options = getElementOptions(el, EventActions.defaultActionOptions, `${prefix}-finally`, true);
            if (options && Object.keys(options).length > 0) {
                options = Object.assign({}, EventActions.defaultActionOptions, options || {});
                await executeAction(el, options);

                if (options.splash === null) {
                    if (splashDlg) {
                        splashDlg.modal.hide();
                        splashDlg = null;
                    }
                }
                if (conditionMet && options.splash) {
                    if (splashDlg) {
                        splashDlg.modal.hide();
                        splashDlg = null;
                    }
                    splashDlg = splashDialog(options.splash);
                }
            }

            // If there is an inline handler, we call it now, but only if all conditions were met
            //  (if any condition was not met, the inline handler is not called)
            if (conditionMet) {   
                // Call the inline handler (if any)
                if (el._eventActions && el._eventActions[eventType]) {
                    el._eventActions[eventType].bind(el)(event);
                }
            }

            // We close the splash dialog (if any)
            if (splashDlg) {
                splashDlg.modal.hide();
            }
        };
        return handler;
    }    

    function addHandler(el, eventType, handler) {
        el.addEventListener(eventType, handler);
        el._eventActions.handlers = el._eventActions.handlers || {};
        el._eventActions.handlers[eventType] = handler;        
    }

    addHandler(el, eventType, actionHandler(el, prefix));
}

const EventActions = {
    execute: executeAction,
    addEventActions: addEventActions,
    addClickActions: (el) => addEventActions(el, 'click', 'ca'),
    addScrollActions: (el) => addEventActions(el, 'scroll', 'sa'),
    removeEventActions: removeEventActions,
    removeClickActions: (el) => removeEventActions(el, 'click'),
    removeScrollActions: (el) => removeEventActions(el, 'scroll'),
    defaultActionOptions: DEFAULT_OPTIONS_ACTION,
    version: "1.0.0"
};

// When the document is loaded, we add the event listeners to the buttons
document.addEventListener('DOMContentLoaded', () => {
    // Look for all elements with data-ca-* to add the click-action functionality, but also the data-ca-1-* (for multiple actions).
    //  We are assuming that data-ca-* is equivalent to data-ca-0-*. But we can omit the data-ca-* if we want to only use suffixed:
    //  data-ca-1-*, data-ca-2-*, etc.
    const selectorsClick = Object.keys(EventActions.defaultActionOptions).map(opt => `[data-ca-${camelToSnakeCase(opt)}],[data-ca-1-${camelToSnakeCase(opt)}]`).join(',');

    // The same for data-sa-* (scroll-action)
    const selectorsScroll = Object.keys(EventActions.defaultActionOptions).map(opt => `[data-sa-${camelToSnakeCase(opt)}],[data-sa-1-${camelToSnakeCase(opt)}]`).join(',');

    document.querySelectorAll(`${selectorsClick}`).forEach(el => {
        addEventActions(el, 'click', 'ca');
    });

    document.querySelectorAll(`${selectorsScroll}`).forEach(el => {
        addEventActions(el, 'scroll', 'sa');
    });
});

exports.EventActions = EventActions;