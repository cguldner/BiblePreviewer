import {arrow, autoUpdate, computePosition, flip, offset, shift} from '@floating-ui/dom';

/**
 * Imperative tooltip controller that handles hover timing and Floating UI positioning.
 */
export class FloatingTooltipController {
    /**
     * Create a generic floating tooltip controller.
     * @param {HTMLElement} referenceElement Link element that triggers the tooltip
     * @param {object} options Tooltip configuration and integration callbacks
     * @param {number} options.activeZIndex Z-index while hovered
     * @param {number} options.hideDelay Delay before hiding in milliseconds
     * @param {number} options.inactiveZIndex Z-index while waiting to hide
     * @param {Function} options.getTooltipContent Returns the current tooltip content element
     * @param {Function} [options.getTooltipMount] Returns the element to append the tooltip into
     * @param {Function} options.loadTooltipContent Loads async content into the tooltip
     * @param {number} options.maxWidth Maximum tooltip width in pixels
     * @param {Function} [options.onHide] Called after hiding
     * @param {Function} [options.onShow] Called after showing
     * @param {number} options.offset Distance from the reference element in pixels
     * @param {number} options.showDelay Delay before showing in milliseconds
     * @param {number} options.transitionDuration Fade duration in milliseconds
     */
    constructor(referenceElement, options) {
        this.reference = referenceElement;
        this.options = options;
        this.ownerDocument = referenceElement.ownerDocument;
        this.tooltipElement = null;
        this.cleanupPosition = null;
        this.showTimer = null;
        this.hideTimer = null;
        this.removeTimer = null;
        this.isReferenceHovered = false;
        this.isTooltipHovered = false;
        this.handleReferenceEnter = this.handleReferenceEnter.bind(this);
        this.handleReferenceLeave = this.handleReferenceLeave.bind(this);
        this.handleTooltipEnter = this.handleTooltipEnter.bind(this);
        this.handleTooltipLeave = this.handleTooltipLeave.bind(this);
        this.attachReferenceListeners();
    }

    attachReferenceListeners() {
        this.reference.addEventListener('mouseenter', this.handleReferenceEnter);
        this.reference.addEventListener('mouseleave', this.handleReferenceLeave);
        this.reference.addEventListener('focus', this.handleReferenceEnter);
        this.reference.addEventListener('blur', this.handleReferenceLeave);
    }

    handleReferenceEnter() {
        this.isReferenceHovered = true;
        this.scheduleShow();
    }

    handleReferenceLeave() {
        this.isReferenceHovered = false;
        this.scheduleHide();
    }

    handleTooltipEnter() {
        this.isTooltipHovered = true;
        this.cancelHide();
        this.setZIndex(this.options.activeZIndex);
    }

    handleTooltipLeave() {
        this.isTooltipHovered = false;
        this.scheduleHide();
    }

    scheduleShow() {
        this.cancelHide();
        if (this.tooltipElement?.isConnected) {
            this.setZIndex(this.options.activeZIndex);
            return;
        }
        clearTimeout(this.showTimer);
        this.showTimer = setTimeout(() => {
            this.show();
        }, this.options.showDelay);
    }

    scheduleHide() {
        clearTimeout(this.showTimer);
        if (!this.tooltipElement?.isConnected) {
            return;
        }
        this.cancelHide();
        this.setZIndex(this.options.inactiveZIndex);
        this.hideTimer = setTimeout(() => {
            if (!this.isReferenceHovered && !this.isTooltipHovered) {
                this.hide();
            }
        }, this.options.hideDelay);
    }

    cancelHide() {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
    }

    ensureTooltipElement() {
        if (this.tooltipElement === null) {
            this.tooltipElement = this.options.getTooltipContent(this.reference, this.ownerDocument);
            this.tooltipElement.style.position = 'absolute';
            this.tooltipElement.style.top = '0';
            this.tooltipElement.style.left = '0';
            this.tooltipElement.style.maxWidth = `${this.options.maxWidth}px`;
            this.tooltipElement.style.zIndex = `${this.options.activeZIndex}`;
            this.tooltipElement.addEventListener('mouseenter', this.handleTooltipEnter);
            this.tooltipElement.addEventListener('mouseleave', this.handleTooltipLeave);
        }
        clearTimeout(this.removeTimer);
        return this.tooltipElement;
    }

    setTooltipContent(tooltipContent) {
        const tooltipElement = this.ensureTooltipElement();
        tooltipElement.replaceChildren(...tooltipContent.childNodes);
    }

    setZIndex(value) {
        if (this.tooltipElement) {
            this.tooltipElement.style.zIndex = `${value}`;
        }
    }

    updatePosition() {
        if (!this.tooltipElement?.isConnected) {
            return;
        }
        const arrowElement = this.tooltipElement.querySelector('.bpTooltipArrow');
        computePosition(this.reference, this.tooltipElement, {
            placement: 'top',
            strategy: 'absolute',
            middleware: [
                offset(this.options.offset),
                flip(),
                shift({
                    padding: 8,
                    crossAxis: true
                }),
                arrowElement ? arrow({element: arrowElement, padding: 12}) : undefined
            ].filter(Boolean)
        }).then(({x, y, placement, middlewareData}) => {
            if (!this.tooltipElement) {
                return;
            }
            Object.assign(this.tooltipElement.style, {
                left: `${x}px`,
                top: `${y}px`
            });
            this.tooltipElement.setAttribute('data-placement', placement);

            if (!arrowElement) {
                return;
            }

            const {x: arrowX, y: arrowY} = middlewareData.arrow ?? {};
            const basePlacement = placement.split('-')[0];
            const staticSide = {
                top: 'bottom',
                right: 'left',
                bottom: 'top',
                left: 'right'
            }[basePlacement];

            Object.assign(arrowElement.style, {
                left: arrowX === undefined || arrowX === null ? '' : `${arrowX}px`,
                top: arrowY === undefined || arrowY === null ? '' : `${arrowY}px`,
                right: '',
                bottom: '',
                [staticSide]: '-8px'
            });
        });
    }

    show() {
        const tooltipElement = this.ensureTooltipElement();
        this.setZIndex(this.options.activeZIndex);
        this.setTooltipContent(this.options.getTooltipContent(this.reference, this.ownerDocument));

        if (!tooltipElement.isConnected) {
            const mountElement = this.options.getTooltipMount?.(this.reference) ?? this.ownerDocument.body;
            mountElement.append(tooltipElement);
        }
        tooltipElement.classList.remove('bpTooltipHidden');
        this.ownerDocument.defaultView.requestAnimationFrame(() => {
            tooltipElement.classList.add('bpTooltipVisible');
        });

        this.options.onShow?.(this);
        this.cleanupPosition = autoUpdate(this.reference, tooltipElement, () => {
            this.updatePosition();
        }, {
            elementResize: false
        });
        this.updatePosition();
        this.options.loadTooltipContent({
            ownerDocument: this.ownerDocument,
            reference: this.reference,
            setTooltipContent: this.setTooltipContent.bind(this),
            updatePosition: this.updatePosition.bind(this)
        });
    }

    hide() {
        if (!this.tooltipElement) {
            return;
        }
        this.cleanupPosition?.();
        this.cleanupPosition = null;
        const tooltipElement = this.tooltipElement;
        tooltipElement.classList.remove('bpTooltipVisible');
        tooltipElement.classList.add('bpTooltipHidden');
        this.removeTimer = setTimeout(() => {
            tooltipElement.remove();
        }, this.options.transitionDuration);
        this.options.onHide?.(this);
    }

    destroyVisibleTooltip() {
        clearTimeout(this.showTimer);
        this.cancelHide();
        if (this.tooltipElement) {
            this.cleanupPosition?.();
            this.cleanupPosition = null;
            this.tooltipElement.remove();
        }
        this.options.onHide?.(this);
    }
}
