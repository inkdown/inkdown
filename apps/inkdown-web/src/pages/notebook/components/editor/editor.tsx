import { useCallback, useEffect } from 'react'
import useCodeMirror from './use-codemirror'
import './editor.css'

interface Props {
  initialDoc: string,
  onChange: (doc: string) => void
}

export const Editor: React.FC<Props> = (props) => {
  const { onChange, initialDoc } = props
  const handleChange = useCallback(
    (    state: { doc: { toString: () => string } }) => onChange(state.doc.toString()),
    [onChange]
  )
  const [refContainer, setVimMode] = useCodeMirror<HTMLDivElement>({
    initialDoc: initialDoc,
    onChange: handleChange
  })


  return (
    <div className="w-full h-full flex flex-col">
      <button onClick={() => setVimMode}>
        toggle vim mode
      </button>
      <div className='h-full w-full flex' ref={refContainer}></div>
    </div>
  )
}