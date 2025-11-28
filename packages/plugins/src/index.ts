/**
 * @inkdown/plugins
 *
 * Official plugins for Inkdown
 */

export { LivePreviewPlugin, livePreviewExtension, livePreviewManifest } from './live-preview';
export { default as QuickFinderPlugin, quickFinderManifest } from './quick-finder';
export {
    SlashCommandsPlugin,
    SlashCommandsSettingTab,
    slashCommandsManifest,
} from './slash-commands';
export { WordCountPlugin, WordCountSettingTab, wordCountManifest } from './word-count';

import type { PluginInfo } from '@inkdown/core';
import { LivePreviewPlugin, livePreviewManifest } from './live-preview';
import { default as QuickFinderPlugin, quickFinderManifest } from './quick-finder';
import { SlashCommandsPlugin, slashCommandsManifest } from './slash-commands';
import { WordCountPlugin, wordCountManifest } from './word-count';

export function getBuiltInPlugins(): PluginInfo[] {
    return [
        {
            manifest: wordCountManifest,
            isBuiltIn: true,
            loader: async () => ({ default: WordCountPlugin }),
        },
        {
            manifest: livePreviewManifest,
            isBuiltIn: true,
            loader: async () => ({ default: LivePreviewPlugin }),
        },
        {
            manifest: quickFinderManifest,
            isBuiltIn: true,
            loader: async () => ({ default: QuickFinderPlugin }),
        },
        {
            manifest: slashCommandsManifest,
            isBuiltIn: true,
            loader: async () => ({ default: SlashCommandsPlugin }),
        },
    ];
}
