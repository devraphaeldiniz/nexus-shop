/** Arredonda valores monetários para 2 casas (evita resíduos de ponto flutuante). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Compara dois valores monetários com tolerância de 1 centavo. */
export function sameAmount(a: number, b: number): boolean {
  return Math.abs(roundMoney(a) - roundMoney(b)) < 0.01
}
