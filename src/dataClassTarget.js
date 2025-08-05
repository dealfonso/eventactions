/**
 * This function allows you to add, remove, toggle or set classes on elements based on data attributes. It supports conditions and
 *   delays for the class changes. Moreover it allows to specify the event type that triggers the class changes.
 * 
 * Usage:
 *   - data-class-event: The event type that triggers the class changes (default is 'click').

    *   - data-class-target: The global selector of the target elements to apply the class changes to. 
    *                        This selector is used to select the targets of the class changes from the document.
    *   - data-class-target-children: A selector to apply the class changes to the children of the target elements.
    *                        This selector is used to select the targets of the class changes, but only from the children 
    *                        of the element that triggered the event.
    *   - data-class-add: The classes to add to the target elements.
    *   - data-class-remove: The classes to remove from the target elements.
    *   - data-class-toggle: The classes to toggle on the target elements.
    *   - data-class-set: The classes to set on the target elements (removes all existing classes).
    *   - data-class-condition: A JavaScript expression that must evaluate to true for the class changes to be applied.
    *   - data-class-delay: The delay in milliseconds (or seconds) before applying the class changes.
    * 
    *   Each of these attributes can be suffixed with a number to allow multiple actions to be specified for the same button.
    *     e.g.: data-class-target-1, data-class-add-1, data-class-target-2, data-class-add-2, etc.
    *   Each suffix is processed in order, allowing for multiple actions to be specified for the same button. The attributes
    *     that have the same suffix are processed together, allowing for complex interactions.
    * 
    *   The only attribute that cannot be suffixed is data-class-event, as it is used to specify the event that triggers 
    *     the class changes.
    * 
    *   Example:
    *     <button data-class-target=".my-target"
    *             data-class-add="class1 class2"
    *             data-class-remove="class3">Click me</button>
    * 
    *   This button, when clicked, will add "class1" and "class2" and remove "class3" to all elements with the class "my-target".
    * 
    *  You can also specify conditions, delays and select the triggering event:
    *     <div data-class-event="scroll" 
    *          data-class-condition="this.scrollHeight - this.offsetHeight - this.scrollTop > 200" 
    *          data-class-target="#toolbar"
    *          data-class-delay="500ms"
    *          data-class-remove="d-none"
    *          data-class-condition-1="this.scrollHeight - this.offsetHeight - this.scrollTop <= 200" 
    *          data-class-target-1="#toolbar"
    *          data-class-add-1="d-none"
    *          data-class-delay-1="500ms"></div>
    *    In this example, the toolbar will be shown when the user scrolls down more than 200 pixels, and hidden when the user scrolls 
    *      back up to less than or equal to 200 pixels. The class changes will be applied after a delay of 500 milliseconds.
    */
document.querySelectorAll('[data-class-target],[data-class-toggle],[data-class-set],[data-class-unset]').forEach(button => {
    const eventType = button.getAttribute('data-class-event') || 'click';
    button.addEventListener(eventType, function() {
        let hasPendingWork = true;
        let index = 0;

        while (hasPendingWork) {
            let suffix = '';
            if (index > 0) {
                suffix = `-${index}`;
            }
            index++;

            const condition = this.getAttribute(`data-class-condition${suffix}`);
            if (condition) {
                // If a condition is specified, we evaluate it
                try {
                    let result = function () {
                        return eval(condition);
                    }.bind(this)();
                    if (typeof result === 'function') {
                        // If the condition is a function, we call it
                        result = result.bind(this)(this);
                    }
                    if (!result) {
                        continue;
                    }
                } catch (error) {
                    console.error(`Error evaluating condition "${condition}":`, error);
                    continue; // Skip this iteration if the condition evaluation fails
                }
            }

            const targetSelector = this.getAttribute(`data-class-target${suffix}`);
            const targetSelectorChildren = this.getAttribute(`data-class-target-children${suffix}`);
            const classNamesAdd = this.getAttribute(`data-class-add${suffix}`);
            const classNamesSet = this.getAttribute(`data-class-set${suffix}`);
            const classNamesRemove = this.getAttribute(`data-class-remove${suffix}`);
            const classNamesToggle = this.getAttribute(`data-class-toggle${suffix}`);

            if (classNamesAdd === null && classNamesRemove === null && classNamesToggle === null && classNamesSet === null) {
                // No more attributes to process, exit the loop
                hasPendingWork = false;
                continue;
            }
            if (classNamesSet !== null && (classNamesAdd !== null || classNamesRemove !== null || classNamesToggle !== null)) {
                console.warn('Cannot set classes and add/remove/toggle classes at the same time:', {
                    classNamesSet: classNamesSet,
                    classNamesAdd: classNamesAdd,
                    classNamesRemove: classNamesRemove,
                    classNamesToggle: classNamesToggle
                });
                continue;
            }

            let delay = this.getAttribute(`data-class-delay${suffix}`);
            if (delay === null) {
                // If no delay is specified, we set it to 0
                delay = 0;
            } else {
                // If delay is specified, we ensure it is a valid time expression
                delay = delay.trim();
                let multiplier = 1; // Default to milliseconds
                if (delay.endsWith('s')) {
                    multiplier = 1000; // Convert seconds to milliseconds
                    delay = delay.slice(0, -1).trim(); // Remove the 's'
                } else if (delay.endsWith('ms')) {
                    delay = delay.slice(0, -2).trim(); // Remove the 'ms'
                } else {
                    // If no unit is specified, we assume it is in milliseconds
                    delay = delay.trim();
                }
                // Convert the delay to a number
                delay = parseFloat(delay) * multiplier;
                if (isNaN(delay) || delay < 0) {
                    console.warn(`Invalid delay value: "${this.getAttribute(`data-class-delay${suffix}`)}". Expected a positive number followed by "ms" or "s".`);
                    delay = 0; // Reset to 0 if invalid
                }
            }
            
            let targetElements = [];
            if (targetSelector === null && targetSelectorChildren === null) {
                // If no target selector is provided, we use the button itself as the target
                targetElements = [ this ];
            } else {
                if (targetSelector) {
                    // If a target selector is provided, we use it to select the elements
                    try {
                        targetElements = [ ...targetElements, ...document.querySelectorAll(targetSelector) ];
                    } catch (error) {
                        console.warn(`Error selecting elements with selector "${targetSelector}"`, error);
                    }
                }
                if (targetSelectorChildren) {
                    // If a target selector for children is provided, we use it to select the elements
                    try {
                        targetElements = [ ...targetElements, ...this.querySelectorAll(targetSelectorChildren) ];
                    }
                    catch (error) {
                        console.warn(`Error selecting children with selector "${targetSelectorChildren}"`,);
                    }
                }
            }
            if (targetElements.length === 0) {
                return;
            }

            const classesAdd = classNamesAdd ? classNamesAdd.split(/\s+/).filter(cls => cls.trim() !== '') : [];
            const classesSet = classNamesSet ? classNamesSet.split(/\s+/).filter(cls => cls.trim() !== '') : [];
            const classesRemove = classNamesRemove ? classNamesRemove.split(/\s+/).filter(cls => cls.trim() !== '') : [];
            const classesToggle = classNamesToggle ? classNamesToggle.split(/\s+/).filter(cls => cls.trim() !== '') : [];

            // If no classes to set, unset or toggle, we cannot proceed
            if (classesAdd.length === 0 && classesRemove.length === 0 && classesToggle.length === 0 && classesSet.length === 0) {
                return;
            }

            // Check if the classes intersect, if so, we cannot proceed
            const intersectionSU = classesAdd.filter(cls => classesRemove.includes(cls));
            const intersectionST = classesAdd.filter(cls => classesToggle.includes(cls));
            const intersectionUT = classesRemove.filter(cls => classesToggle.includes(cls));
            if (intersectionSU.length > 0 || intersectionST.length > 0 || intersectionUT.length > 0) {
                console.warn('Cannot set, unset or toggle the same class at the same time:', {
                    classesAdd: classesAdd,
                    classesRemove: classesRemove,
                    classesToggle: classesToggle
                });
                return;
            }

            // If a delay is specified, we use setTimeout to apply the classes after the delay
            let applyClasses = () => {
                for (const targetElement of targetElements) {
                    if (classesSet.length > 0) {
                        targetElement.classList.remove(...targetElement.classList); // Remove all existing classes
                        classesSet.forEach(cls => {
                            targetElement.classList.add(cls);
                        }
                        );
                        continue; // If we are setting classes, we do not need to add/remove/toggle classes
                    }
                    classesToggle.forEach(cls => {
                        targetElement.classList.toggle(cls);
                    });
                    classesAdd.forEach(cls => {
                        targetElement.classList.add(cls);
                    });
                    classesRemove.forEach(cls => {
                        targetElement.classList.remove(cls);
                    });
                }
            };
            if (delay > 0) {
                setTimeout(applyClasses, delay);
            } else {
                applyClasses();
            }
        }
    });
});    