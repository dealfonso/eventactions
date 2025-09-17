# EventActions

This library allows to manage actions on HTML elements using custom data attributes, making it easy to manipulate classes, content, and events declaratively. It is ideal for buttons, controls, and any interactive element.

e.g. if on a button you want to toggle a class on itself when clicked, you can do:

```html
<button id="my-button">push me</button>
<script>
    document.getElementById('my-button').addEventListener('click', function() {
        this.classList.toggle('active');
    });
</script>
```

Using `EventActions`, you can achieve the same with:

```html
<button data-ca-class-toggle="active">push me</button>
```

Moreover using the `data-ca-*` attributes, you can define multiple actions, conditions, delays, confirmations, and even modify the content of elements, when the user clicks an html element (e.g. a button).

```html
<button
  class="btn btn-primary mb-3"
  data-ca-confirm="Are you sure?" data-ca-confirm-accept-text="Yes, do it" data-ca-confirm-cancel-text="No, cancel"
  data-ca-target="li.one, li.two"
  data-ca-class-toggle="active"
  data-ca-1-delay="500"
  data-ca-1-acknowledge="Other action completed again"
  data-ca-1-acknowledge-button="Great!">push me</button>
<ul class="list-group">
  <li class="list-group-item one">One</li>
  <li class="list-group-item active two">Two</li>
</ul>
```

In this example, when clicking the button, a confirmation dialog appears. If confirmed, it toggles the `active` class on the first list item, then toggles it on the second list item, waits 500 ms, and finally shows an acknowledgment dialog.

The library also integrates with scroll events, allowing to trigger actions when an element is scrolled, using the `data-sa-*` attributes.

```html
<div id="scrollTarget" style="overflow-y: scroll;"
    data-sa-target="#scrollTopButton"
    data-sa-class-remove="disabled"
    data-sa-1-condition-action="this.scrollTop < 25"
    data-sa-1-target="#scrollTopButton"
    data-sa-1-class-add="disabled"
    data-sa-2-target="#scrollButton"
    data-sa-2-class-remove="disabled"
    data-sa-3-target="#scrollButton"
    data-sa-3-condition-action="this.scrollTop >= 25"
    data-sa-3-class-add="disabled">
    <!-- Lots of content to enable scrolling -->
</div>
<button id="scrollButton" class="btn btn-secondary mt-3" data-ca-scroll-to="bottom" data-ca-target="#scrollTarget">Scroll to Bottom</button>
<button id="scrollTopButton" class="btn btn-secondary mt-3 disabled" data-ca-scroll-to="top" data-ca-target="#scrollTarget">Scroll to Top</button>
```

In this example, when the user scrolls the `#scrollTarget` element, it enables or disables the "Scroll to Top" and "Scroll to Bottom" buttons based on the scroll position.

## Installation

### Using CDN (jsdelivr)

```html
<script src="https://cdn.jsdelivr.net/gh/dealfonso/eventactions/dist/eventactions.js"></script>
```

### Using your own server

Download the file `dist/eventactions.js` and add it to your project. Then include it in your HTML:

```html
<script src="/path/to/eventactions.js"></script>
```

## Basic usage

The library allows the next actions:
- Add, remove, toggle, or set classes on elements.
- Modify the content of elements.
- Define conditions for when actions should be executed.
- Set delays before actions are executed.
- Show confirmation dialogs before executing actions.
- Execute custom JavaScript code when actions are triggered.
- Scroll to specific positions of elements.

And this can be done using either `data-ca-*` attributes for attending **click events** or `data-sa-*` attributes for **scroll events**.

### Simple example

```html
<button
  data-ca-target=".my-target"
  data-ca-class-add="visible"
  data-ca-class-remove="hidden"
>
  Show element
</button>

<div class="my-target hidden">This is the target</div>
```

When clicking the button, the class `visible` is added and the class `hidden` is removed from all elements with the class `.my-target`.

### Advanced example with condition and delay

```html
<div
  data-sa-condition="this.scrollTop > 100"
  data-sa-target="#toolbar"
  data-sa-delay="500"
  data-sa-class-remove="d-none"
>
  <!-- Scrollable content -->
</div>

<div id="toolbar" class="d-none">Toolbar</div>
```

The toolbar will be shown when the user scrolls and the condition is met, after a delay of 500 ms. This will be interesting, for example, to show a toolbar when the user scrolls down a certain amount.

## Available options

You can use the following attributes on your elements (prefix `data-ca-` for click, `data-sa-` for scroll):

- **data-ca-target**: Global selector for the target elements (obtained from the document).
- **data-ca-target-children**: Selector for the children of the triggering element (queried to the children of the triggering element).
- **data-ca-class-add**: Classes to add.
- **data-ca-class-remove**: Classes to remove.
- **data-ca-class-toggle**: Classes to toggle.
- **data-ca-class-set**: Classes to set (removes all existing ones).
- **data-ca-condition**: JS expression that must be true to execute the action and to continue with subsequent actions.
- **data-ca-condition-action**: JS expression that must be true to execute the action that is being evaluated, but does not affect subsequent actions; i.e. if false, the action is skipped but the next actions are evaluated normally.
- **data-ca-confirm**: Confirmation message before executing the action. If the user cancels, the action is not executed and subsequent actions are not evaluated (i.e. it works like `condition`).
- **data-ca-confirm-accept-text**: Text for the accept button in the confirmation dialog.
- **data-ca-confirm-cancel-text**: Text for the cancel button in the confirmation dialog.
- **data-ca-delay**: Delay before executing the action (in ms). The delay will be applied only if the action is executed (i.e. if the condition is met and the user confirms, if applicable).
- **data-ca-execute**: JS expression to execute if the condition is met and the user confirms.
- **data-ca-scroll-to**: Scrolls the target element (`top`, `bottom`, `left`, `right`).
- **data-ca-content-method**: Method to modify the content (`innerHTML` or `textContent`).
- **data-ca-content-set**: Sets the content of the target element.
- **data-ca-content-append**: Appends content at the end.
- **data-ca-content-prepend**: Prepends content at the beginning.
- **data-ca-content-clear**: Clears the content before modifying it.
- **data-ca-acknowledge**: Alert message after executing the action.
- **data-ca-acknowledge-button**: Text for the button in the alert dialog.
- **data-ca-splash**: Shows a dialog with a custom message while the action is being executed, and hides it when finished.

## Advanced usage

### Advanced examples

#### Multiple actions with conditions, confirmations, delays, and content manipulation

```html
<button id="myButton" class="btn btn-primary"
data-ca-content-method="textContent" data-ca-content-clear data-ca-target="#myTarget"
data-ca-1-content-append="uno" data-ca-1-target="#myTarget"
data-ca-2-confirm="Are you sure?" data-ca-2-confirm-accept-text="Yes, do it" data-ca-2-confirm-cancel-text="No, cancel" data-ca-2-content-append="dos" data-ca-2-target="#myTarget"
data-ca-3-confirm="Should do it again?" data-ca-3-content-append="tres" data-ca-3-target="#myTarget"
data-ca-4-class-toggle="btn-primary"
data-ca-4-execute="(el) => { console.log('Button clicked', el); }"
data-ca-4-spinner="loader-1 loader"
data-ca-5-delay="1000"
data-ca-5-acknowledge="Action completed"
onclick="console.log('Inline click');"
>
Click me</button>
<div id="myTarget" class="border rounded mt-3 p-3">This is the target</div>
```

When clicking the button, the following happens:
1. The content of the target element is cleared.
2. The text "uno" is appended to the target element.
3. A confirmation dialog appears with the message "Are you sure?". If the user confirms, "dos" is appended to the target element. If the user cancels, the action is not executed and subsequent actions are not evaluated.
4. A confirmation dialog appears with the message "Should do it again?". If the user confirms, "tres" is appended to the target element. If the user cancels, the action is not executed and subsequent actions are not evaluated.
5. The `btn-primary` class is toggled on the button.
6. A spinner with the classes `loader-1 loader` is shown on the button while executing the next action.
7. A delay of 1000 ms is applied.
8. An acknowledgment dialog appears with the message "Action completed".
9. The inline `onclick` event is executed, logging "Inline click" to the console.

#### Other example

```html
<button class="btn btn-primary"
data-ca-splash="<div class='d-flex flex-column align-items-center justify-content-center'><div class='loader loader-1'></div> Processing...</div>"
data-ca-1-delay="2000"
data-ca-1-acknowledge="Other action completed"
data-ca-1-acknowledge-button="Great!"
data-ca-2-confirm="Are you sure?" data-ca-2-confirm-accept-text="Yes, do it" data-ca-2-confirm-cancel-text="No, cancel"
data-ca-3-delay="2000"
data-ca-3-acknowledge="Other action completed again"
data-ca-3-acknowledge-button="Great!"
data-ca-3-splash="<div class='d-flex flex-column align-items-center justify-content-center'><div class='loader loader-2'></div> Processing Again...</div>"
data-ca-4-delay="1000"
data-ca-4-acknowledge="All done!"
>pulsame</button>
```

When clicking the button, the following happens:
1. A splash dialog appears with a loader and the message "Processing...".
2. A delay of 2000 ms is applied.
3. An acknowledgment dialog appears with the message "Other action completed" and a button labeled "Great!".
4. A confirmation dialog appears with the message "Are you sure?". If the user confirms, the next actions are executed. If the user cancels, the action is not executed and subsequent actions are not evaluated.
5. A splash dialog appears with a different loader and the message "Processing Again...".
6. A delay of 2000 ms is applied.
7. An acknowledgment dialog appears with the message "Other action completed again" and a button labeled "Great!".
8. A delay of 1000 ms is applied.
9. An acknowledgment dialog appears with the message "All done!".

### Chaining Multiple actions

You can add numeric suffixes to define several actions on the same element:

```html
<button
  data-ca-target=".one"
  data-ca-add-class="active"
  data-ca-1-target=".two"
  data-ca-1-remove-class="inactive"
>
  Multiple actions
</button>
```

The `data-ca-*` attributes is somehow the equivalent to `data-ca-0-*`, and will define the very first action. It is possible to omit the `data-ca-*` attributes and start with `data-ca-1-*`.

> The notation `data-ca-0-*` cannot be used, as the library does not recognize it. The first action will start with `data-ca-*` or `data-ca-1-*`.

In this example, when the button is clicked, it will add the `active` class to elements with class `.one`, then remove the `inactive` class from elements with class `.two`.

### The last action

It is possible to define a last action that will be executed only if all previous actions were executed (i.e. if all conditions were met and the user confirmed, if applicable), using the `-last` suffix:

```html
<button
    data-ca-target=".one"
    data-ca-last-target=".four"
    data-ca-last-class-toggle="active"
>
  Last action
</button>
```

The idea is make it possible to number the actions without worrying about whether the last one is the last or not. You can use `data-ca-1-*`, `data-ca-2-*`, etc. for all actions, and then use `data-ca-last-*` for the final action that should be executed only if all previous ones were executed.

### Final actions

You can define actions that will always be executed at the end, regardless of whether previous actions were executed or not, using the `-finally` suffix:

```html
<button
  data-ca-target=".one"
  data-ca-class-add="active"
  data-ca-1-target=".two"
  data-ca-1-remove-class="inactive"
  data-ca-finally-target=".three"
  data-ca-finally-class-toggle="highlight"
>
  Final action
</button>
```

This case is similar to `try...catch...finally` in programming languages. The actions defined with `-finally` will always be executed at the end, regardless of whether previous actions were executed or not.

## Using with Bootstrap 5

The library integrates well with Bootstrap 5, using its modal dialogs for confirmations and acknowledgments. You can customize the text of the buttons using the `data-ca-confirm-accept-text`, `data-ca-confirm-cancel-text`, and `data-ca-acknowledge-button` attributes.

If Bootstrap 5 is not available, the library will use the native `confirm()` and `alert()` functions, and the `splash` attribute will be ignored.

## Additional notes

- Attributes can be used with suffixes (`-1`, `-2`, ...) to define sequences of actions.
- The event is determined by the prefix (`ca` for click, `sa` for scroll).
- It is recommended to check the source code for advanced options such as final actions, spinners, and confirmations.

---

This README reflects the actual behavior of the code, where attributes are processed by prefix and suffix, and actions are executed in order, allowing conditions, confirmations, delays, and manipulation of classes and content.
