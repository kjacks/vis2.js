import { Vertex } from './Vertex'
import { Entity, PropertyType, Property, Value } from '@alephdata/followthemoney';
import { GraphLayout } from './GraphLayout';
import { Rectangle } from './Rectangle';
import { Point } from './Point';

interface IEdgeData {
  id: string
  type: string
  label: string
  sourceId: string
  targetId: string
  entityId?: string
  propertyQName?: string
}

export class Edge {
  private readonly layout: GraphLayout
  public readonly id: string
  public readonly type: string
  public readonly label: string
  public readonly sourceId: string
  public readonly targetId: string
  public readonly entityId?: string
  public readonly propertyQName?: string

  // temp flag for disposal of outdated nodes
  public garbage: boolean = false

  constructor(layout: GraphLayout, data: IEdgeData) {
    this.layout = layout
    this.id = data.id
    this.type = data.type
    this.label = data.label
    this.sourceId = data.sourceId
    this.targetId = data.targetId
    this.entityId = data.entityId
    this.propertyQName = data.propertyQName
  }

  getSource(): Vertex | undefined {
    return this.layout.vertices.get(this.sourceId)
  }

  getTarget(): Vertex | undefined {
    return this.layout.vertices.get(this.targetId)
  }

  isHidden(): boolean {
    const source = this.getSource()
    if (!source || source.isHidden()) {
      return true;
    }
    const target = this.getTarget()
    if (!target || target.isHidden()) {
      return true;
    }
    return false;
  }

  isEntity(): boolean {
    return !!(this.entityId && !this.propertyQName && this.layout.entities.get(this.entityId))
  }

  getEntity(): Entity | undefined {
    if (this.entityId) {
      return this.layout.entities.get(this.entityId)
    }
  }

  getRect(): Rectangle {
    const source = this.getSource()
    const target = this.getTarget()
    if (source && target) {
      return Rectangle.fromPoints(source.position, target.position)
    }
    return new Rectangle(0, 0, 0, 0)
  }

  getCenter(): Point {
    return this.getRect().getCenter()
  }

  isLinkedToVertex(vertex: Vertex): boolean {
    return this.sourceId === vertex.id ||
           this.targetId === vertex.id;
  }

  update(other: Edge): Edge {
    const data = other.toJSON()
    // TODO: remove if there are no changes
    return Edge.fromJSON(this.layout, data)
  }

  clone(): Edge {
    return Edge.fromJSON(this.layout, this.toJSON())
  }

  toJSON(): IEdgeData {
    return {
      id: this.id,
      type: this.type,
      label: this.label,
      sourceId: this.sourceId,
      targetId: this.targetId,
      entityId: this.entityId,
      propertyQName: this.propertyQName
    }
  }

  static fromJSON(layout: GraphLayout, data: any): Edge {
    return new Edge(layout, data as IEdgeData)
  }

  static fromEntity(layout: GraphLayout, entity: Entity, source: Vertex, target: Vertex): Edge {
    return new Edge(layout, {
      id: `${entity.id}(${source.id}, ${target.id})`,
      type: PropertyType.ENTITY,
      label: entity.getCaption(),
      sourceId: source.id,
      targetId: target.id,
      entityId: entity.id
    })
  }

  static fromValue(layout: GraphLayout, property: Property, source: Vertex, target: Vertex) {
    if (!source.entityId) {
      throw new Error('No source entity for value edge.')
    }
    return new Edge(layout, {
      id: `${source.entityId}:${property.qname}(${target.id})`,
      type: property.type.name,
      label: property.label,
      sourceId: source.id,
      targetId: target.id,
      entityId: source.entityId,
      propertyQName: property.qname
    })
  }

}
