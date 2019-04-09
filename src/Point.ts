export class Point {
  x: number = 0
  y: number = 0
  set({ x = this.x, y = this.y }): Point {
    this.x = x
    this.y = y
    return this
  }
}