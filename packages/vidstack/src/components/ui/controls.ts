import { Component, effect } from 'maverick.js';
import { DOMEvent, setAttribute, setStyle } from 'maverick.js/std';

import { useMediaContext, type MediaContext } from '../../core/api/media-context';
import { setAttributeIfEmpty } from '../../utils/dom';

/**
 * This component creates a container for control groups.
 *
 * @attr data-visible - Whether controls should be visible.
 * @attr data-pip - Whether picture-in-picture mode is active.
 * @attr data-fullscreen - Whether fullscreen mode is active.
 * @docs {@link https://www.vidstack.io/docs/player/components/media/controls}
 */
export class Controls extends Component<ControlsProps, {}, ControlsEvents> {
  static props: ControlsProps = {
    hideDelay: 2000,
  };

  private _media!: MediaContext;

  protected override onSetup(): void {
    this._media = useMediaContext();
    effect(this._watchHideDelay.bind(this));
  }

  protected override onAttach(el: HTMLElement): void {
    const { pictureInPicture, fullscreen } = this._media.$state;

    setStyle(el, 'pointer-events', 'none');
    setAttributeIfEmpty(el, 'role', 'group');

    this.setAttributes({
      'data-visible': this._isShowing.bind(this),
      'data-fullscreen': fullscreen,
      'data-pip': pictureInPicture,
    });

    effect(() => {
      this.dispatch('change', { detail: this._isShowing() });
    });

    effect(this._hideControls.bind(this));

    effect(() => {
      const isFullscreen = fullscreen();
      for (const side of ['top', 'right', 'bottom', 'left']) {
        setStyle(el, `padding-${side}`, isFullscreen && `env(safe-area-inset-${side})`);
      }
    });
  }

  private _hideControls() {
    if (!this.el) return;

    const { controls } = this._media.$state,
      isHidden = controls() || this._media.$iosControls();

    setAttribute(this.el, 'aria-hidden', isHidden ? 'true' : null);
    setStyle(this.el, 'display', isHidden ? 'none' : null);
  }

  private _watchHideDelay() {
    const { controls } = this._media.player,
      { hideDelay } = this.$props;

    // Use controls delay prop on player if this is the default value.
    controls.defaultDelay = hideDelay() === 2000 ? this._media.$props.controlsDelay() : hideDelay();
  }

  private _isShowing() {
    const { controlsVisible } = this._media.$state;
    return controlsVisible();
  }
}

export interface ControlsProps {
  /**
   * The default amount of delay in milliseconds while media playback is progressing without user
   * activity to hide the controls.
   */
  hideDelay: number;
}

export interface ControlsEvents {
  change: ControlsChangeEvent;
}

/**
 * Fired when the active state of the controls change.
 *
 * @detail isVisible
 */
export interface ControlsChangeEvent extends DOMEvent<boolean> {}
