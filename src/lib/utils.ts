export const fmt = (n: number) =>
  'Rp ' + Math.round(n).toLocaleString('id-ID')

export const today = () => new Date().toISOString().split('T')[0]
