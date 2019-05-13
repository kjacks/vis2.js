import * as React from 'react'
import {Entity, Property, Values} from '@alephdata/followthemoney';
import {DateType} from '../types/DateType';
import {TextType} from '../types/TextType';
import {EntityType} from '../types/EntityType';
import {GraphContext} from '../GraphContext';

interface IPropertyEditorProps {
  entity: Entity,
  property: Property,
  onEntityChanged: (nextEntity: Entity) => void
}

export class PropertyEditor extends React.Component<IPropertyEditorProps> {
  static contextType = GraphContext;
  context!: React.ContextType<typeof GraphContext>;

  onPropertyChanged = (nextValues: Values) => {
    this.props.entity.properties.set(this.props.property, nextValues);
    this.props.onEntityChanged(this.props.entity)
  }

  render() {
    if (!this.context) return null;
    const { entity, property } = this.props;
    const values = entity.getProperty(property);
    const commonProps = {
      onPropertyChanged: this.onPropertyChanged,
      values: values,
      property: property,
      entity: entity
    };

    if (DateType.group.has(property.type.name)) {
      return <DateType {...commonProps} />;
    }

    if (EntityType.group.has(property.type.name)) {
      return <EntityType entities={this.context.layout.entities} {...commonProps} />
    }

    // fallback
    return <TextType {...commonProps} />;
  }
}