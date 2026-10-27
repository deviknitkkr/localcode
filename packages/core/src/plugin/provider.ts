import { LMStudioPlugin } from "./provider/lmstudio.js"
import { OllamaPlugin } from "./provider/ollama.js"
import { VLLMPlugin } from "./provider/vllm.js"
import type { PluginInternal } from "./internal.js"

export const ProviderPlugins: PluginInternal.InternalPlugin[] = [OllamaPlugin, LMStudioPlugin, VLLMPlugin]
