/**
 * Setting - A helper class for building settings UI
 */

// Import to ensure HTMLElement extensions are installed
import './PluginSettingTab';
import { setIcon } from '../utils/icons';

export interface SettingTextComponent {
    inputEl: HTMLInputElement;
    getValue(): string;
    setValue(value: string): SettingTextComponent;
    setPlaceholder(placeholder: string): SettingTextComponent;
    onChange(callback: (value: string) => void): SettingTextComponent;
    setDisabled(disabled: boolean): SettingTextComponent;
}

export interface SettingTextAreaComponent {
    inputEl: HTMLTextAreaElement;
    getValue(): string;
    setValue(value: string): SettingTextAreaComponent;
    setPlaceholder(placeholder: string): SettingTextAreaComponent;
    onChange(callback: (value: string) => void): SettingTextAreaComponent;
    setDisabled(disabled: boolean): SettingTextAreaComponent;
}

export interface SettingToggleComponent {
    toggleEl: HTMLElement;
    getValue(): boolean;
    setValue(value: boolean): SettingToggleComponent;
    onChange(callback: (value: boolean) => void): SettingToggleComponent;
    setDisabled(disabled: boolean): SettingToggleComponent;
}

export interface SettingDropdownComponent {
    selectEl: HTMLSelectElement;
    getValue(): string;
    setValue(value: string): SettingDropdownComponent;
    addOption(value: string, display: string): SettingDropdownComponent;
    addOptions(options: Record<string, string>): SettingDropdownComponent;
    onChange(callback: (value: string) => void): SettingDropdownComponent;
    setDisabled(disabled: boolean): SettingDropdownComponent;
}

export interface SettingSliderComponent {
    sliderEl: HTMLInputElement;
    getValue(): number;
    setValue(value: number): SettingSliderComponent;
    setLimits(min: number, max: number, step: number | 'any'): SettingSliderComponent;
    setDynamicTooltip(): SettingSliderComponent;
    onChange(callback: (value: number) => void): SettingSliderComponent;
    setDisabled(disabled: boolean): SettingSliderComponent;
}

export interface SettingButtonComponent {
    buttonEl: HTMLButtonElement;
    setButtonText(text: string): SettingButtonComponent;
    setIcon(icon: string): SettingButtonComponent;
    setCta(): SettingButtonComponent;
    setWarning(): SettingButtonComponent;
    setDisabled(disabled: boolean): SettingButtonComponent;
    onClick(callback: () => void): SettingButtonComponent;
}

export interface SettingExtraButtonComponent {
    extraSettingsEl: HTMLElement;
    setIcon(icon: string): SettingExtraButtonComponent;
    setTooltip(tooltip: string): SettingExtraButtonComponent;
    setDisabled(disabled: boolean): SettingExtraButtonComponent;
    onClick(callback: () => void): SettingExtraButtonComponent;
}

export interface SettingColorPickerComponent {
    colorPickerEl: HTMLInputElement;
    getValue(): string;
    setValue(value: string): SettingColorPickerComponent;
    onChange(callback: (value: string) => void): SettingColorPickerComponent;
}

/**
 * Setting class - Creates a setting item with name, description, and controls
 */
export class Setting {
    settingEl: HTMLElement;
    infoEl: HTMLElement;
    nameEl: HTMLElement;
    descEl: HTMLElement;
    controlEl: HTMLElement;

    private components: any[] = [];

    constructor(containerEl: HTMLElement) {
        this.settingEl = containerEl.createDiv({ cls: 'setting-item' });
        this.infoEl = this.settingEl.createDiv({ cls: 'setting-item-info' });
        this.nameEl = this.infoEl.createDiv({ cls: 'setting-item-name' });
        this.descEl = this.infoEl.createDiv({ cls: 'setting-item-description' });
        this.controlEl = this.settingEl.createDiv({ cls: 'setting-item-control' });
    }

    /**
     * Set the name of the setting
     */
    setName(name: string | DocumentFragment): this {
        if (typeof name === 'string') {
            this.nameEl.textContent = name;
        } else {
            this.nameEl.empty();
            this.nameEl.appendChild(name);
        }
        return this;
    }

    /**
     * Set the description of the setting
     */
    setDesc(desc: string | DocumentFragment): this {
        if (typeof desc === 'string') {
            this.descEl.textContent = desc;
        } else {
            this.descEl.empty();
            this.descEl.appendChild(desc);
        }
        return this;
    }

    /**
     * Mark this setting as a heading
     */
    setHeading(): this {
        this.settingEl.classList.add('setting-item-heading');
        return this;
    }

    /**
     * Set custom CSS class
     */
    setClass(cls: string): this {
        this.settingEl.classList.add(cls);
        return this;
    }

    /**
     * Set whether this setting should be disabled
     */
    setDisabled(disabled: boolean): this {
        this.settingEl.classList.toggle('setting-item-disabled', disabled);
        this.components.forEach((c) => {
            c.setDisabled?.(disabled);
        });
        return this;
    }

    /**
     * Add a text input
     */
    addText(cb: (component: SettingTextComponent) => void): this {
        const inputEl = this.controlEl.createEl('input', {
            type: 'text',
            cls: 'ink-text-input',
        });

        const component: SettingTextComponent = {
            inputEl,
            getValue: () => inputEl.value,
            setValue: (value: string) => {
                inputEl.value = value;
                return component;
            },
            setPlaceholder: (placeholder: string) => {
                inputEl.placeholder = placeholder;
                return component;
            },
            onChange: (callback: (value: string) => void) => {
                inputEl.addEventListener('input', () => callback(inputEl.value));
                return component;
            },
            setDisabled: (disabled: boolean) => {
                inputEl.disabled = disabled;
                return component;
            },
        };

        this.components.push(component);
        cb(component);
        return this;
    }

    /**
     * Add a textarea
     */
    addTextArea(cb: (component: SettingTextAreaComponent) => void): this {
        const inputEl = this.controlEl.createEl('textarea', {
            cls: 'ink-textarea',
        });

        const component: SettingTextAreaComponent = {
            inputEl,
            getValue: () => inputEl.value,
            setValue: (value: string) => {
                inputEl.value = value;
                return component;
            },
            setPlaceholder: (placeholder: string) => {
                inputEl.placeholder = placeholder;
                return component;
            },
            onChange: (callback: (value: string) => void) => {
                inputEl.addEventListener('input', () => callback(inputEl.value));
                return component;
            },
            setDisabled: (disabled: boolean) => {
                inputEl.disabled = disabled;
                return component;
            },
        };

        this.components.push(component);
        cb(component);
        return this;
    }

    /**
     * Add a toggle switch
     */
    addToggle(cb: (component: SettingToggleComponent) => void): this {
        const toggleEl = this.controlEl.createDiv({ cls: 'ink-toggle' });
        toggleEl.createDiv({ cls: 'ink-toggle-thumb' }); // thumb element for the toggle animation
        let value = false;
        let onChangeCallback: ((value: boolean) => void) | null = null;

        const component: SettingToggleComponent = {
            toggleEl,
            getValue: () => value,
            setValue: (newValue: boolean) => {
                value = newValue;
                toggleEl.classList.toggle('ink-toggle-checked', value);
                return component;
            },
            onChange: (callback: (value: boolean) => void) => {
                onChangeCallback = callback;
                return component;
            },
            setDisabled: (disabled: boolean) => {
                toggleEl.classList.toggle('ink-toggle-disabled', disabled);
                return component;
            },
        };

        toggleEl.addEventListener('click', () => {
            if (toggleEl.classList.contains('ink-toggle-disabled')) return;
            value = !value;
            toggleEl.classList.toggle('ink-toggle-checked', value);
            onChangeCallback?.(value);
        });

        this.components.push(component);
        cb(component);
        return this;
    }

    /**
     * Add a dropdown select
     */
    addDropdown(cb: (component: SettingDropdownComponent) => void): this {
        const selectEl = this.controlEl.createEl('select', {
            cls: 'ink-dropdown',
        });

        const component: SettingDropdownComponent = {
            selectEl,
            getValue: () => selectEl.value,
            setValue: (value: string) => {
                selectEl.value = value;
                return component;
            },
            addOption: (value: string, display: string) => {
                selectEl.createEl('option', { value, text: display });
                return component;
            },
            addOptions: (options: Record<string, string>) => {
                for (const [value, display] of Object.entries(options)) {
                    selectEl.createEl('option', { value, text: display });
                }
                return component;
            },
            onChange: (callback: (value: string) => void) => {
                selectEl.addEventListener('change', () => callback(selectEl.value));
                return component;
            },
            setDisabled: (disabled: boolean) => {
                selectEl.disabled = disabled;
                return component;
            },
        };

        this.components.push(component);
        cb(component);
        return this;
    }

    /**
     * Add a slider
     */
    addSlider(cb: (component: SettingSliderComponent) => void): this {
        const container = this.controlEl.createDiv({ cls: 'ink-slider-container' });
        const sliderEl = container.createEl('input', {
            type: 'range',
            cls: 'ink-slider',
        });
        const tooltipEl = container.createSpan({ cls: 'ink-slider-tooltip' });
        tooltipEl.style.display = 'none';

        const component: SettingSliderComponent = {
            sliderEl,
            getValue: () => Number.parseFloat(sliderEl.value),
            setValue: (value: number) => {
                sliderEl.value = String(value);
                tooltipEl.textContent = String(value);
                return component;
            },
            setLimits: (min: number, max: number, step: number | 'any') => {
                sliderEl.min = String(min);
                sliderEl.max = String(max);
                sliderEl.step = String(step);
                return component;
            },
            setDynamicTooltip: () => {
                tooltipEl.style.display = 'inline';
                tooltipEl.textContent = sliderEl.value;
                sliderEl.addEventListener('input', () => {
                    tooltipEl.textContent = sliderEl.value;
                });
                return component;
            },
            onChange: (callback: (value: number) => void) => {
                sliderEl.addEventListener('input', () =>
                    callback(Number.parseFloat(sliderEl.value)),
                );
                return component;
            },
            setDisabled: (disabled: boolean) => {
                sliderEl.disabled = disabled;
                return component;
            },
        };

        this.components.push(component);
        cb(component);
        return this;
    }

    /**
     * Add a button
     */
    addButton(cb: (component: SettingButtonComponent) => void): this {
        const buttonEl = this.controlEl.createEl('button', {
            cls: 'ink-button',
        });

        const component: SettingButtonComponent = {
            buttonEl,
            setButtonText: (text: string) => {
                buttonEl.textContent = text;
                return component;
            },
            setIcon: (icon: string) => {
                setIcon(buttonEl, icon);
                return component;
            },
            setCta: () => {
                buttonEl.classList.add('ink-button-primary');
                return component;
            },
            setWarning: () => {
                buttonEl.classList.add('ink-button-danger');
                return component;
            },
            setDisabled: (disabled: boolean) => {
                buttonEl.disabled = disabled;
                return component;
            },
            onClick: (callback: () => void) => {
                buttonEl.addEventListener('click', callback);
                return component;
            },
        };

        this.components.push(component);
        cb(component);
        return this;
    }

    /**
     * Add an extra button (small icon button)
     */
    addExtraButton(cb: (component: SettingExtraButtonComponent) => void): this {
        const extraSettingsEl = this.controlEl.createDiv({
            cls: 'ink-extra-button',
        });

        const component: SettingExtraButtonComponent = {
            extraSettingsEl,
            setIcon: (icon: string) => {
                setIcon(extraSettingsEl, icon);
                return component;
            },
            setTooltip: (tooltip: string) => {
                extraSettingsEl.title = tooltip;
                return component;
            },
            setDisabled: (disabled: boolean) => {
                extraSettingsEl.classList.toggle('ink-extra-button-disabled', disabled);
                return component;
            },
            onClick: (callback: () => void) => {
                extraSettingsEl.addEventListener('click', callback);
                return component;
            },
        };

        this.components.push(component);
        cb(component);
        return this;
    }

    /**
     * Add a color picker
     */
    addColorPicker(cb: (component: SettingColorPickerComponent) => void): this {
        const colorPickerEl = this.controlEl.createEl('input', {
            type: 'color',
            cls: 'ink-color-picker',
        });

        const component: SettingColorPickerComponent = {
            colorPickerEl,
            getValue: () => colorPickerEl.value,
            setValue: (value: string) => {
                colorPickerEl.value = value;
                return component;
            },
            onChange: (callback: (value: string) => void) => {
                colorPickerEl.addEventListener('input', () => callback(colorPickerEl.value));
                return component;
            },
        };

        this.components.push(component);
        cb(component);
        return this;
    }

    /**
     * Hide/show the setting
     */
    setHidden(hidden: boolean): this {
        this.settingEl.style.display = hidden ? 'none' : '';
        return this;
    }

    /**
     * Remove the setting from DOM
     */
    clear(): void {
        this.settingEl.remove();
    }
}

// Note: HTMLElement extensions (createDiv, createSpan, createEl, empty) are defined in PluginSettingTab.ts
// Import that module to get the extensions installed
