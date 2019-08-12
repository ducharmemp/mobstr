import { IObservableValue, IObservableArray, IObservableObject, Lambda } from "mobx";

export type Constructor<T> = new(...args: any[]) => T;

export interface CascadeOptions {
  cascade?: boolean;
}

export interface Meta {
  __meta__: {
    key: IObservableValue<string | symbol | number | null>;

    collectionName: string | symbol | number;
    relationships: Record<
      string | symbol,
      {
        type: any;
        keys: IObservableArray<string>;
        options: CascadeOptions;
      }
    >;
    indicies: IObservableArray<string | symbol | number>;
  };
}

export interface Store extends IObservableObject {
  collections: Record<
    string | symbol | number,
    Map<string | symbol | number, any>
  >;
  primaryKeys: Map<string, any>;
  indicies: Record<string | symbol | number, Map<string | symbol | number, any>>;
  triggers: Map<number, Lambda>;
  nextId: number;
}
