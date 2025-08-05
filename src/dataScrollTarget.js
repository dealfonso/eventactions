/**
 * This script adds a click event listener to elements with the
 * data-scroll-target attribute. When clicked, it scrolls the target
 * elements specified by the data-scroll-target attribute to the top,
 * bottom, left, or right based on the data-scroll-to attribute.
 * 
 * If no target selector is provided, it defaults to the element itself.
 * If no data-scroll-to attribute is provided, it defaults to scrolling
 * to the top.
 * 
 * @param {HTMLElement} el - The element to which the scroll target functionality is applied.
 * @returns {void}
 */
function makeScrollTarget(el) {
    if (!el || !el.getAttribute) {
        console.error('Invalid element provided to makeClearTarget');
        return;
    }

    const scrollTarget_handler = function() {
        const targetSelector = this.getAttribute('data-scroll-target');
        let targetElements = [];


        // If no target selector is provided, default to the element itself
        // Otherwise, query for the elements matching the selector
        if (!targetSelector) {
            targetElements = [el];
        } else {
            targetElements = document.querySelectorAll(targetSelector);
        }

        if (targetElements.length === 0) {
            console.warn(`No elements found for selector: ${targetSelector}`);
            return;
        }

        // Validate the scroll-to attribute
        const scrollTo = this.getAttribute('data-scroll-to').toLowerCase() || 'top';
        if (!['top', 'bottom', 'left', 'right'].includes(scrollTo)) {
            console.warn(`Invalid scroll-to value: ${scrollTo}`);
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
        }
    };
    // Check if the element already has a _bf property
    // and if it has a scrollTarget_handler, remove it before adding a new one
    if (!el._bf) {
        el._bf = {};
    }
    if (el._bf.scrollTarget_handler || null) {
        el.removeEventListener('click', el._bf.scrollTarget_handler);
    }
    el._bf.scrollTarget_handler = scrollTarget_handler;

    // Add the click event listener to the element
    el.addEventListener('click', scrollTarget_handler);
}


document.querySelectorAll('[data-scroll-target]').forEach(button => {
    makeScrollTarget(button);
});