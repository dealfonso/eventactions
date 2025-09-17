/**
    MIT License

    Copyright 2023 Carlos A. (https://github.com/dealfonso)

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

(function (exports) {
	if (typeof exports === "undefined") {
		exports = window;
	}
	const DEFAULT_OPTIONS_ACTION = {
		condition: null,
		conditionAction: null,
		confirm: null,
		confirmAcceptText: "OK",
		confirmCancelText: "Cancel",
		execute: null,
		target: null,
		targetChildren: null,
		classAdd: null,
		classRemove: null,
		classToggle: null,
		classSet: null,
		scrollTo: null,
		contentMethod: "innerHTML",
		contentSet: null,
		contentAppend: null,
		contentPrepend: null,
		contentClear: null,
		delay: 0,
		acknowledge: null,
		acknowledgeButton: "OK",
		splash: null
	};
	async function executeAction(el, actionOptions) {
		actionOptions = Object.assign({}, EventActions.defaultActionOptions, actionOptions || {});
		let targetElements = [];
		const targetSelector = sanitizeValue(actionOptions.target || null);
		const targetChildrenSelector = sanitizeValue(actionOptions.targetChildren || null);
		if (targetSelector === null && targetChildrenSelector === null) {
			targetElements = [el];
		} else {
			if (targetSelector) {
				try {
					targetElements = [...targetElements, ...document.querySelectorAll(targetSelector)];
				} catch (error) {
					console.warn(`Error selecting elements with selector "${targetSelector}"`, error);
				}
			}
			if (targetChildrenSelector) {
				try {
					targetElements = [...targetElements, ...el.querySelectorAll(targetChildrenSelector)];
				} catch (error) {
					console.warn(`Error selecting children with selector "${targetChildrenSelector}"`, error);
				}
			}
		}
		const condition = sanitizeValue(actionOptions.condition || null);
		if (condition) {
			if (typeof condition === "function") {
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
				if (typeof result === "function") {
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
		const conditionAction = sanitizeValue(actionOptions.conditionAction || null);
		let shouldSkipAction = false;
		if (conditionAction) {
			if (typeof conditionAction === "function") {
				result = conditionAction.bind(el)(targetElements);
				if (!result) {
					return true;
				}
			}
			try {
				let result = function () {
					return eval(conditionAction);
				}.bind(el)(targetElements);
				if (typeof result === "function") {
					result = result.bind(el)(targetElements);
				}
				if (!result) {
					shouldSkipAction = true;
				}
			} catch (error) {
				console.error(`Error evaluating action condition "${conditionAction}":`, error);
				shouldSkipAction = true;
			}
		}
		if (shouldSkipAction) {
			return true;
		}
		const confirmMessage = sanitizeValue(actionOptions.confirm || null);
		if (confirmMessage) {
			const confirmAcceptText = sanitizeValue(actionOptions.confirmAcceptText || "OK");
			const confirmCancelText = sanitizeValue(actionOptions.confirmCancelText || "Cancel");
			try {
				await confirmDialog(confirmMessage, confirmAcceptText, confirmCancelText);
			} catch (error) {
				return false;
			}
		}
		const execute = sanitizeValue(actionOptions.execute || null);
		if (execute) {
			if (typeof execute === "function") {
				execute.bind(el)(targetElements);
			} else {
				try {
					let result = function () {
						return eval(execute);
					}.bind(el)();
					if (typeof result === "function") {
						result = result.bind(el)(targetElements);
					}
				} catch (error) {
					console.error(`Error executing action "${execute}":`, error);
				}
			}
		}
		const classesAdd = sanitizeValue(actionOptions.classAdd || null);
		const classesRemove = sanitizeValue(actionOptions.classRemove || null);
		const classesToggle = sanitizeValue(actionOptions.classToggle || null);
		const classesSet = sanitizeValue(actionOptions.classSet || null);
		const classListAdd = classesAdd ? classesAdd.split(/\s+/).filter(cls => cls.trim() !== "") : [];
		const classListRemove = classesRemove ? classesRemove.split(/\s+/).filter(cls => cls.trim() !== "") : [];
		const classListToggle = classesToggle ? classesToggle.split(/\s+/).filter(cls => cls.trim() !== "") : [];
		const classListSet = classesSet ? classesSet.split(/\s+/).filter(cls => cls.trim() !== "") : [];
		const intersectionSR = classListAdd.filter(cls => classListRemove.includes(cls));
		const intersectionST = classListAdd.filter(cls => classListToggle.includes(cls));
		const intersectionRT = classListRemove.filter(cls => classListToggle.includes(cls));
		if (intersectionSR.length > 0 || intersectionST.length > 0 || intersectionRT.length > 0) {
			console.warn("Cannot set, unset or toggle the same class at the same time:", {
				classListAdd: classListAdd,
				classListRemove: classListRemove,
				classListToggle: classListToggle
			});
			return false;
		}
		let applyClasses = () => {
			for (const targetElement of targetElements) {
				if (classListSet.length > 0) {
					targetElement.classList.remove(...targetElement.classList);
					classListSet.forEach(cls => {
						targetElement.classList.add(cls);
					});
					continue;
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
		const contentMethod = sanitizeValue(actionOptions.contentMethod || "innerHTML");
		if (!["innerHTML", "textContent"].includes(contentMethod)) {
			console.warn(`Invalid content method: ${contentMethod}`);
			return;
		}
		const contentSet = sanitizeValue(actionOptions.contentSet || null);
		const contentAppend = sanitizeValue(actionOptions.contentAppend || null);
		const contentPrepend = sanitizeValue(actionOptions.contentPrepend || null);
		const contentClear = actionOptions.contentClear === true || actionOptions.contentClear === "true" || actionOptions.contentClear === "";
		let applyContentChanges = () => {
			for (const targetElement of targetElements) {
				if (contentClear) {
					targetElement[contentMethod] = "";
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
		};
		const scrollTo = sanitizeValue(actionOptions.scrollTo || null);
		if (scrollTo && !["top", "bottom", "left", "right"].includes(scrollTo)) {
			console.warn(`Invalid scroll-to value: ${scrollTo}`);
			scrollTo = null;
		}
		let applyScroll = () => {
			if (!scrollTo) {
				return;
			}
			for (const targetElement of targetElements) {
				switch (scrollTo) {
				case "top":
					targetElement.scrollTop = 0;
					break;
				case "bottom":
					targetElement.scrollTop = targetElement.scrollHeight;
					break;
				case "left":
					targetElement.scrollLeft = 0;
					break;
				case "right":
					targetElement.scrollLeft = targetElement.scrollWidth;
					break;
				}
				break;
			}
		};
		const delay = parseFloat(actionOptions.delay) || 0;
		if (delay > 0 && !isNaN(delay)) {
			await new Promise(resolve => setTimeout(resolve, delay));
		}
		applyClasses();
		applyContentChanges();
		applyScroll();
		const acknowledgeMessage = sanitizeValue(actionOptions.acknowledge || null);
		const acknowledgeButton = sanitizeValue(actionOptions.acknowledgeButton || "OK");
		if (acknowledgeMessage) {
			await messageDialog(acknowledgeMessage, acknowledgeButton);
		}
		return true;
	}

	function removeEventActions(el, eventType = null) {
		if (!el || !el._eventActions) return;
		if (!eventType) {
			for (const type in el._eventActions) {
				removeEventActions(el, type);
			}
			return;
		}
		if (!el._eventActions[eventType]) return;
		if (el._eventActions.handlers && el._eventActions.handlers[eventType]) {
			el.removeEventListener(eventType, el._eventActions.handlers[eventType]);
			delete el._eventActions.handlers[eventType];
		}
		if (el._eventActions[eventType]) {
			el[`on${eventType}`] = el._eventActions[eventType];
			delete el._eventActions[eventType];
		} else {
			el[`on${eventType}`] = null;
		}
		if (el._eventActions.handlers && Object.keys(el._eventActions.handlers).length === 0) {
			delete el._eventActions;
		}
	}

	function addEventActions(el, eventType = "click", prefix = "ca") {
		if (!el) return;
		if (el._eventActions && el._eventActions[eventType]) return;
		el._eventActions = el._eventActions || {};
		el._eventActions[eventType] = el[`on${eventType}`] || null;
		el[`on${eventType}`] = null;

		function actionHandler(el, prefix) {
			let handler = async function (event) {
				event.preventDefault();
				event.stopPropagation();
				let conditionMet = true;
				let splashDlg = null;
				let options = getElementOptions(el, EventActions.defaultActionOptions, prefix, true);
				if (options && Object.keys(options).length > 0) {
					options = Object.assign({}, EventActions.defaultActionOptions, options || {});
					conditionMet = await executeAction(el, options);
					if (conditionMet && options.splash) {
						if (splashDlg) {
							splashDlg.modal.hide();
							splashDlg = null;
						}
						splashDlg = splashDialog(options.splash);
					}
				}
				let i = 1;
				while (conditionMet) {
					options = getElementOptions(el, EventActions.defaultActionOptions, `${prefix}-${i}`, true);
					if (options && Object.keys(options).length > 0) {
						const clearSplash = options.splash === null || options.splash === "" || options.splash === "false" || options.splash === "0" || options.splash === false;
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
				if (conditionMet) {
					if (el._eventActions && el._eventActions[eventType]) {
						el._eventActions[eventType].bind(el)(event);
					}
				}
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
		addClickActions: el => addEventActions(el, "click", "ca"),
		addScrollActions: el => addEventActions(el, "scroll", "sa"),
		removeEventActions: removeEventActions,
		removeClickActions: el => removeEventActions(el, "click"),
		removeScrollActions: el => removeEventActions(el, "scroll"),
		defaultActionOptions: DEFAULT_OPTIONS_ACTION,
		version: "1.0.0"
	};
	document.addEventListener("DOMContentLoaded", () => {
		const selectorsClick = Object.keys(EventActions.defaultActionOptions).map(opt => `[data-ca-${camelToSnakeCase(opt)}],[data-ca-1-${camelToSnakeCase(opt)}]`).join(",");
		const selectorsScroll = Object.keys(EventActions.defaultActionOptions).map(opt => `[data-sa-${camelToSnakeCase(opt)}],[data-sa-1-${camelToSnakeCase(opt)}]`).join(",");
		document.querySelectorAll(`${selectorsClick}`).forEach(el => {
			addEventActions(el, "click", "ca");
		});
		document.querySelectorAll(`${selectorsScroll}`).forEach(el => {
			addEventActions(el, "scroll", "sa");
		});
	});
	exports.EventActions = EventActions;

	function snakeToCamelCase(str) {
		return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
	}

	function camelToSnakeCase(str) {
		str = str.replace(/([0-9]+)/g, g => `-${g}`);
		str = str.replace(/[A-Z]/g, g => `-${g[0].toLowerCase()}`);
		str = str.replace(/--+/g, "-");
		str = str.replace(/^-+/, "").replace(/-+$/, "");
		return str;
	}

	function sanitizeValue(value) {
		if (value === null || value === undefined) {
			return null;
		}
		if (typeof value !== "string") {
			return value;
		}
		value = value.trim();
		if (value === "") {
			return null;
		}
		return value;
	}

	function getElementOptions(el, defaultOptions, prefix, onlyExisting = false) {
		let options = {};
		const prefixStr = prefix ? `${camelToSnakeCase(prefix)}-` : "";
		for (const option of Object.keys(defaultOptions)) {
			const attributeName = prefixStr + camelToSnakeCase(option);
			const attributeValue = el.dataset[attributeName] || el.getAttribute(`data-${attributeName}`);
			if (attributeValue !== null && attributeValue !== undefined) {
				if (typeof defaultOptions[option] === "boolean") {
					options[option] = attributeValue.toLowerCase() === "true";
				} else if (typeof defaultOptions[option] === "number") {
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
		return options;
	}
	const DEFAULT_MODAL_OPTIONS = {
		title: null,
		body: null,
		btnAcceptText: "Accept",
		btnCancelText: "Cancel",
		btnAcceptClass: "btn-primary",
		btnCancelClass: "btn-secondary",
		size: "md",
		centered: true,
		backdrop: "static",
		keyboard: true,
		focus: true,
		onAccept: null,
		onCancel: null,
		onShow: null,
		onShown: null,
		onHide: null,
		onHidden: null,
		autoShow: true
	};

	function confirmDialog(message, btnAcceptText = "Accept", btnCancelText = "Cancel", title = null) {
		const modalDialog = bsCreateModal({
			title: title,
			body: message,
			btnAcceptText: btnAcceptText,
			btnCancelText: btnCancelText
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

	function messageDialog(message, btnAcceptText = "OK", title = null) {
		const modalDialog = bsCreateModal({
			title: title,
			body: message,
			btnAcceptText: btnAcceptText,
			btnCancelText: null
		});
		if (!modalDialog) {
			return new Promise(resolve => {
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
			backdrop: "static",
			keyboard: false,
			focus: false
		});
		return modalDialog;
	}

	function bsCreateModal(options = {}) {
		if (typeof bootstrap === "undefined" || !bootstrap.Modal) {
			console.warn("bsCreateModal: Bootstrap 5 is required for this function to work.");
			return null;
		}
		options = Object.assign({}, DEFAULT_MODAL_OPTIONS, options || {});
		if (!options.title && !options.body && !options.btnAcceptText && !options.btnCancelText) {
			console.error("bsCreateModal: At least one of title, body, btnAcceptText or btnCancelText must be provided");
			return null;
		}
		if (["sm", "md", "lg", "xl", "xxl"].indexOf(options.size) === -1) {
			options.size = "md";
		}
		if (options.size === "md") {
			options.size = "";
		} else {
			options.size = `modal-${options.size}`;
		}
		if (typeof options.centered !== "boolean") {
			options.centered = DEFAULT_MODAL_OPTIONS.centered;
		}
		if (options.backdrop !== true && options.backdrop !== false && options.backdrop !== "static") {
			options.backdrop = DEFAULT_MODAL_OPTIONS.backdrop;
		}
		if (typeof options.keyboard !== "boolean") {
			options.keyboard = DEFAULT_MODAL_OPTIONS.keyboard;
		}
		if (typeof options.focus !== "boolean") {
			options.focus = DEFAULT_MODAL_OPTIONS.focus;
		}
		if (options.btnAcceptText !== null && typeof options.btnAcceptText !== "string") {
			options.btnAcceptText = DEFAULT_MODAL_OPTIONS.btnAcceptText;
		}
		if (options.btnCancelText !== null && typeof options.btnCancelText !== "string") {
			options.btnCancelText = DEFAULT_MODAL_OPTIONS.btnCancelText;
		}
		if (options.autoShow !== true && options.autoShow !== false) {
			options.autoShow = DEFAULT_MODAL_OPTIONS.autoShow;
		}
		options.btnAcceptText = sanitizeValue(options.btnAcceptText);
		options.btnCancelText = sanitizeValue(options.btnCancelText);
		options.title = sanitizeValue(options.title);
		options.body = sanitizeValue(options.body);
		if (options.onAccept && typeof options.onAccept !== "function") {
			options.onAccept = null;
		}
		if (options.onCancel && typeof options.onCancel !== "function") {
			options.onCancel = null;
		}
		if (options.onShow && typeof options.onShow !== "function") {
			options.onShow = null;
		}
		if (options.onShown && typeof options.onShown !== "function") {
			options.onShown = null;
		}
		if (options.onHide && typeof options.onHide !== "function") {
			options.onHide = null;
		}
		if (options.onHidden && typeof options.onHidden !== "function") {
			options.onHidden = null;
		}
		let modalContainer = document.createElement("div");
		modalContainer.innerHTML = `
<div class="modal ${options.size}" tabindex="-1" ${options.backdrop === false ? 'data-bs-backdrop="false"' : options.backdrop === "static" ? 'data-bs-backdrop="static"' : ""} ${options.keyboard === false ? 'data-bs-keyboard="false"' : ""} ${options.focus === false ? 'data-bs-focus="false"' : ""}">
  <div class="modal-dialog ${options.centered ? "modal-dialog-centered" : ""}">
    <div class="modal-content">
      ${options.title === null ? "" : `<div class="modal-header"><h5 class="modal-title">${options.title}</h5></div>`}
      ${options.body === null ? "" : `<div class="modal-body">${options.body}</div>`}
      ${options.btnAcceptText === null && options.btnCancelText === null ? "" : `
      <div class="modal-footer">
        ${options.btnCancelText === null ? "" : `<button type="button" class="btn ${options.btnCancelClass}" data-bs-dismiss="modal">${options.btnCancelText}</button>`}
        ${options.btnAcceptText === null ? "" : `<button type="button" class="btn ${options.btnAcceptClass}">${options.btnAcceptText}</button>`}
      </div>`}
    </div>
  </div>
</div>`;
		const acceptButton = modalContainer.querySelector(".btn-primary");
		const cancelButton = modalContainer.querySelector(".btn-secondary");
		const modalElement = modalContainer.querySelector(".modal");
		document.body.appendChild(modalContainer);
		const modal = new bootstrap.Modal(modalElement);
		options = Object.assign({}, DEFAULT_MODAL_OPTIONS, options || {});
		const promise = new Promise((resolve, reject) => {
			if (options.btnAcceptText) {
				acceptButton.addEventListener("click", e => {
					if (options.onAccept && typeof options.onAccept === "function") {
						options.onAccept(e, modalElement);
					}
					resolve("accept");
					modal.hide();
				}, {
					once: true
				});
			}
			if (options.btnCancelText) {
				cancelButton.addEventListener("click", e => {
					if (options.onCancel && typeof options.onCancel === "function") {
						options.onCancel(e, modalElement);
					}
					reject("cancel");
					modal.hide();
				}, {
					once: true
				});
			}
			if (options.keyboard === true) {
				modalElement.addEventListener("keydown", e => {
					if (e.key === "Escape") {
						if (options.onCancel && typeof options.onCancel === "function") {
							options.onCancel(e, modalElement);
						}
						reject("cancel");
						modal.hide();
					}
				}, {
					once: true
				});
			}
			if (options.onShow && typeof options.onShow === "function") {
				modalElement.addEventListener("show.bs.modal", e => {
					options.onShow(e, modalElement);
				}, {
					once: true
				});
			}
			if (options.onShown && typeof options.onShown === "function") {
				modalElement.addEventListener("shown.bs.modal", e => {
					options.onShown(e, modalElement);
				}, {
					once: true
				});
			}
			if (options.onHide && typeof options.onHide === "function") {
				modalElement.addEventListener("hide.bs.modal", e => {
					options.onHide(e, modalElement);
				}, {
					once: true
				});
			}
			if (options.onHidden && typeof options.onHidden === "function") {
				modalElement.addEventListener("hidden.bs.modal", e => {
					options.onHidden(e, modalElement);
				}, {
					once: true
				});
			}
			modalElement.addEventListener("hide.bs.modal", function (event) {
				if (document.activeElement) {
					document.activeElement.blur();
				}
			});
			modalElement.addEventListener("hidden.bs.modal", e => {
				modal.dispose();
				modalContainer.remove();
			}, {
				once: true
			});
		});
		modal.show();
		promise.modal = modal;
		return promise;
	}
})(window);
