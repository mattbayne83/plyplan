export const getPieceLabel = (index: number) => {
  let label = ''
  let i = index
  do {
    label = String.fromCharCode(65 + (i % 26)) + label
    i = Math.floor(i / 26) - 1
  } while (i >= 0)
  return label
}
