export interface UpdateSettingRequest {
  theme?: string
  markdownLineStyler?: boolean
  vimMode?: boolean
  syntaxHighlighting?: boolean
  bracketMathing?: boolean
  autocompletion?: boolean
  hightlightSelectionMatches?: boolean
  hightlightActiveLine?: boolean
  lineNumbers?: boolean
}