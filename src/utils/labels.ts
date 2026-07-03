export const getPieceLabel = (index: number) => {
  let label = ''
  let i = index
  do {
    label = String.fromCharCode(65 + (i % 26)) + label
    i = Math.floor(i / 26) - 1
  } while (i >= 0)
  return label
}

/** Tab label for a sheet result: offcuts and new sheets number independently. */
export const getSheetLabel = (sheets: Array<{ isOffcut: boolean }>, index: number) => {
  const isOffcut = sheets[index].isOffcut
  const ordinal = sheets.slice(0, index + 1).filter((s) => s.isOffcut === isOffcut).length
  return isOffcut ? `Offcut ${ordinal}` : `Sheet ${ordinal}`
}
